import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/transfers
export const getTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      sourceWarehouse: { organizationId: req.user.organizationId },
      ...(status && { status }),
    };

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    res.json({
      transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transfers error:', err);
    res.status(500).json({ error: 'Gagal mengambil data transfer' });
  }
};

// POST /api/transfers
export const createTransfer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { sourceWarehouseId, destinationWarehouseId, items, notes } = req.body;

    if (sourceWarehouseId === destinationWarehouseId) {
      return res.status(400).json({ error: 'Gudang sumber dan tujuan tidak boleh sama' });
    }

    const source = await prisma.warehouse.findUnique({
      where: { id: parseInt(sourceWarehouseId) },
    });

    if (!source || source.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Gudang sumber tidak ditemukan' });
    }

    const destination = await prisma.warehouse.findUnique({
      where: { id: parseInt(destinationWarehouseId) },
    });

    if (!destination || destination.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Gudang tujuan tidak ditemukan' });
    }

    // Check stock availability
    for (const item of items) {
      const stock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: parseInt(sourceWarehouseId),
            productId: parseInt(item.productId),
          },
        },
      });

      if (!stock || stock.quantity < parseInt(item.quantity)) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(item.productId) },
        });
        return res.status(409).json({
          error: `Stok ${product?.name || 'produk'} tidak cukup. Tersedia: ${stock?.quantity || 0}`,
        });
      }
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.stockTransfer.create({
        data: {
          sourceWarehouseId: parseInt(sourceWarehouseId),
          destinationWarehouseId: parseInt(destinationWarehouseId),
          createdBy: req.user.id,
          notes: notes || null,
        },
      });

      for (const item of items) {
        await tx.stockTransferItem.create({
          data: {
            stockTransferId: t.id,
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
          },
        });
      }

      return t;
    });

    res.status(201).json({ message: 'Transfer berhasil dibuat', transfer });
  } catch (err) {
    console.error('Create transfer error:', err);
    res.status(500).json({ error: 'Gagal membuat transfer' });
  }
};

// POST /api/transfers/:id/send
export const sendTransfer = async (req, res) => {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer tidak ditemukan' });
    }

    if (transfer.status !== 'draft') {
      return res.status(409).json({ error: 'Transfer harus dalam status draft' });
    }

    await prisma.$transaction(async (tx) => {
      // Deduct from source
      for (const item of transfer.items) {
        const stock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: transfer.sourceWarehouseId,
              productId: item.productId,
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error('Stok tidak cukup');
        }

        await tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: transfer.sourceWarehouseId,
              productId: item.productId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            userId: req.user.id,
            movementType: 'transfer',
            quantity: item.quantity,
            previousStock: stock.quantity,
            currentStock: stock.quantity - item.quantity,
            notes: `Transfer keluar ke gudang ${transfer.destinationWarehouseId}`,
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'sent' },
      });
    });

    res.json({ message: 'Transfer berhasil dikirim' });
  } catch (err) {
    console.error('Send transfer error:', err);
    res.status(500).json({ error: 'Gagal mengirim transfer' });
  }
};

// POST /api/transfers/:id/receive
export const receiveTransfer = async (req, res) => {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer tidak ditemukan' });
    }

    if (transfer.status !== 'sent') {
      return res.status(409).json({ error: 'Transfer harus dalam status sent' });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: transfer.destinationWarehouseId,
              productId: item.productId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            warehouseId: transfer.destinationWarehouseId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });

        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: transfer.destinationWarehouseId,
              productId: item.productId,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            userId: req.user.id,
            movementType: 'transfer',
            quantity: item.quantity,
            previousStock: currentStock.quantity - item.quantity,
            currentStock: currentStock.quantity,
            notes: `Transfer masuk dari gudang ${transfer.sourceWarehouseId}`,
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'received',
          receivedBy: req.user.id,
        },
      });
    });

    res.json({ message: 'Transfer berhasil diterima' });
  } catch (err) {
    console.error('Receive transfer error:', err);
    res.status(500).json({ error: 'Gagal menerima transfer' });
  }
};

// POST /api/transfers/:id/cancel
export const cancelTransfer = async (req, res) => {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer tidak ditemukan' });
    }

    if (transfer.status === 'received') {
      return res.status(409).json({ error: 'Tidak dapat membatalkan transfer yang sudah diterima' });
    }

    await prisma.stockTransfer.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' },
    });

    res.json({ message: 'Transfer berhasil dibatalkan' });
  } catch (err) {
    console.error('Cancel transfer error:', err);
    res.status(500).json({ error: 'Gagal membatalkan transfer' });
  }
};
