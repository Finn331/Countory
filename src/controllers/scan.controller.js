import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/scans
export const getScans = async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, warehouseId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      user: { organizationId: req.user.organizationId },
      ...(productId && { productId: parseInt(productId) }),
      ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [scans, total] = await Promise.all([
      prisma.scanSession.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scanSession.count({ where }),
    ]);

    res.json({
      scans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get scans error:', err);
    res.status(500).json({ error: 'Gagal mengambil data scan' });
  }
};

// POST /api/scans
export const createScan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const {
      productId,
      warehouseId,
      detectionProfileId,
      scanMode,
      transactionType,
      detectedCount,
      confirmedCount,
      processingTimeMs,
      imageQuality,
      deviceType,
      browser,
      correctionReason,
    } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product || product.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
    });

    if (!warehouse || warehouse.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Gudang tidak ditemukan' });
    }

    const scan = await prisma.scanSession.create({
      data: {
        userId: req.user.id,
        productId: parseInt(productId),
        warehouseId: parseInt(warehouseId),
        detectionProfileId: detectionProfileId ? parseInt(detectionProfileId) : null,
        scanMode: scanMode || 'photo',
        transactionType,
        detectedCount: parseInt(detectedCount) || 0,
        confirmedCount: parseInt(confirmedCount) || 0,
        processingTimeMs: parseInt(processingTimeMs) || 0,
        imageQuality: imageQuality || null,
        deviceType: deviceType || null,
        browser: browser || null,
        correctionReason: correctionReason || null,
        syncStatus: 'synced',
      },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    });

    // Update stock based on transaction type
    if (confirmedCount > 0) {
      const qty = parseInt(confirmedCount);

      if (transactionType === 'stock_in') {
        await prisma.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: parseInt(warehouseId),
              productId: parseInt(productId),
            },
          },
          update: { quantity: { increment: qty } },
          create: {
            warehouseId: parseInt(warehouseId),
            productId: parseInt(productId),
            quantity: qty,
          },
        });

        const currentStock = await prisma.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: parseInt(warehouseId),
              productId: parseInt(productId),
            },
          },
        });

        await prisma.inventoryMovement.create({
          data: {
            productId: parseInt(productId),
            warehouseId: parseInt(warehouseId),
            scanSessionId: scan.id,
            userId: req.user.id,
            movementType: 'stock_in',
            quantity: qty,
            previousStock: currentStock.quantity - qty,
            currentStock: currentStock.quantity,
            notes: `Scan result - ${scanMode} mode`,
          },
        });
      } else if (transactionType === 'stock_out') {
        const currentStock = await prisma.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: parseInt(warehouseId),
              productId: parseInt(productId),
            },
          },
        });

        if (!currentStock || currentStock.quantity < qty) {
          return res.status(409).json({
            error: `Stok tidak cukup. Tersedia: ${currentStock?.quantity || 0}`,
          });
        }

        await prisma.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: parseInt(warehouseId),
              productId: parseInt(productId),
            },
          },
          data: { quantity: { decrement: qty } },
        });

        await prisma.inventoryMovement.create({
          data: {
            productId: parseInt(productId),
            warehouseId: parseInt(warehouseId),
            scanSessionId: scan.id,
            userId: req.user.id,
            movementType: 'stock_out',
            quantity: qty,
            previousStock: currentStock.quantity,
            currentStock: currentStock.quantity - qty,
            notes: `Scan result - ${scanMode} mode`,
          },
        });
      }
    }

    res.status(201).json({ message: 'Scan berhasil disimpan', scan });
  } catch (err) {
    console.error('Create scan error:', err);
    res.status(500).json({ error: 'Gagal menyimpan scan' });
  }
};

// POST /api/scans/sync
export const syncScans = async (req, res) => {
  try {
    const { scans } = req.body;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ error: 'Data scan tidak valid' });
    }

    const results = [];
    for (const scanData of scans) {
      try {
        const scan = await prisma.scanSession.create({
          data: {
            userId: req.user.id,
            productId: parseInt(scanData.productId),
            warehouseId: parseInt(scanData.warehouseId),
            scanMode: scanData.scanMode || 'photo',
            transactionType: scanData.transactionType,
            detectedCount: parseInt(scanData.detectedCount) || 0,
            confirmedCount: parseInt(scanData.confirmedCount) || 0,
            processingTimeMs: parseInt(scanData.processingTimeMs) || 0,
            deviceType: scanData.deviceType || null,
            browser: scanData.browser || null,
            syncStatus: 'synced',
          },
        });
        results.push({ id: scanData.localId, status: 'synced', serverId: scan.id });
      } catch (err) {
        results.push({ id: scanData.localId, status: 'error', error: err.message });
      }
    }

    res.json({ message: 'Sinkronisasi selesai', results });
  } catch (err) {
    console.error('Sync scans error:', err);
    res.status(500).json({ error: 'Gagal melakukan sinkronisasi' });
  }
};

// GET /api/scans/:id
export const getScan = async (req, res) => {
  try {
    const scan = await prisma.scanSession.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        product: true,
        warehouse: true,
        user: { select: { name: true } },
        detectionProfile: true,
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan tidak ditemukan' });
    }

    res.json({ scan });
  } catch (err) {
    console.error('Get scan error:', err);
    res.status(500).json({ error: 'Gagal mengambil data scan' });
  }
};
