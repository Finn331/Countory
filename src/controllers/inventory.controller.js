import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/inventory/movements
export const getMovements = async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, warehouseId, movementType, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      product: { organizationId: req.user.organizationId },
      ...(productId && { productId: parseInt(productId) }),
      ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
      ...(movementType && { movementType }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
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
      prisma.inventoryMovement.count({ where }),
    ]);

    res.json({
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get movements error:', err);
    res.status(500).json({ error: 'Gagal mengambil data riwayat' });
  }
};

// POST /api/inventory/stock-in
export const stockIn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { productId, warehouseId, quantity, referenceNumber, notes } = req.body;

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

    const result = await prisma.$transaction(async (tx) => {
      const warehouseStock = await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: parseInt(warehouseId),
            productId: parseInt(productId),
          },
        },
        update: {
          quantity: { increment: parseInt(quantity) },
        },
        create: {
          warehouseId: parseInt(warehouseId),
          productId: parseInt(productId),
          quantity: parseInt(quantity),
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          warehouseId: parseInt(warehouseId),
          userId: req.user.id,
          movementType: 'stock_in',
          quantity: parseInt(quantity),
          previousStock: warehouseStock.quantity - parseInt(quantity),
          currentStock: warehouseStock.quantity,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
        },
      });

      return { movement, newStock: warehouseStock.quantity };
    });

    res.status(201).json({
      message: 'Stok masuk berhasil',
      movement: result.movement,
      newStock: result.newStock,
    });
  } catch (err) {
    console.error('Stock in error:', err);
    res.status(500).json({ error: 'Gagal memproses stok masuk' });
  }
};

// POST /api/inventory/stock-out
export const stockOut = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { productId, warehouseId, quantity, referenceNumber, notes } = req.body;

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

    const warehouseStock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: parseInt(warehouseId),
          productId: parseInt(productId),
        },
      },
    });

    if (!warehouseStock || warehouseStock.quantity < parseInt(quantity)) {
      return res.status(409).json({
        error: `Stok tidak cukup. Stok tersedia: ${warehouseStock?.quantity || 0} unit`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedStock = await tx.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: parseInt(warehouseId),
            productId: parseInt(productId),
          },
        },
        data: {
          quantity: { decrement: parseInt(quantity) },
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          warehouseId: parseInt(warehouseId),
          userId: req.user.id,
          movementType: 'stock_out',
          quantity: parseInt(quantity),
          previousStock: warehouseStock.quantity,
          currentStock: updatedStock.quantity,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
        },
      });

      return { movement, newStock: updatedStock.quantity };
    });

    res.status(201).json({
      message: 'Stok keluar berhasil',
      movement: result.movement,
      newStock: result.newStock,
    });
  } catch (err) {
    console.error('Stock out error:', err);
    res.status(500).json({ error: 'Gagal memproses stok keluar' });
  }
};

// POST /api/inventory/adjustment
export const adjustment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { productId, warehouseId, newQuantity, notes } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product || product.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const warehouseStock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: parseInt(warehouseId),
          productId: parseInt(productId),
        },
      },
    });

    const previousStock = warehouseStock?.quantity || 0;
    const difference = parseInt(newQuantity) - previousStock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedStock = await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: parseInt(warehouseId),
            productId: parseInt(productId),
          },
        },
        update: {
          quantity: parseInt(newQuantity),
        },
        create: {
          warehouseId: parseInt(warehouseId),
          productId: parseInt(productId),
          quantity: parseInt(newQuantity),
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          warehouseId: parseInt(warehouseId),
          userId: req.user.id,
          movementType: 'adjustment',
          quantity: Math.abs(difference),
          previousStock,
          currentStock: parseInt(newQuantity),
          notes: notes || `Penyesuaian stok dari ${previousStock} ke ${newQuantity}`,
        },
      });

      return { movement, newStock: updatedStock.quantity };
    });

    res.status(201).json({
      message: 'Penyesuaian stok berhasil',
      movement: result.movement,
      newStock: result.newStock,
    });
  } catch (err) {
    console.error('Adjustment error:', err);
    res.status(500).json({ error: 'Gagal melakukan penyesuaian stok' });
  }
};

// GET /api/inventory/summary
export const getSummary = async (req, res) => {
  try {
    const [totalProducts, totalStock, lowStockProducts, recentMovements] = await Promise.all([
      prisma.product.count({
        where: {
          organizationId: req.user.organizationId,
          status: 'active',
        },
      }),
      prisma.warehouseStock.aggregate({
        where: {
          product: { organizationId: req.user.organizationId },
        },
        _sum: { quantity: true },
      }),
      prisma.product.findMany({
        where: {
          organizationId: req.user.organizationId,
          status: 'active',
          minimumStock: { gt: 0 },
        },
        include: {
          warehouseStocks: {
            select: { quantity: true },
          },
        },
        take: 10,
      }),
      prisma.inventoryMovement.findMany({
        where: {
          product: { organizationId: req.user.organizationId },
        },
        include: {
          product: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lowStock = lowStockProducts
      .map((p) => ({
        ...p,
        currentStock: p.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
      }))
      .filter((p) => p.currentStock < p.minimumStock);

    res.json({
      summary: {
        totalProducts,
        totalStock: totalStock._sum.quantity || 0,
        lowStockCount: lowStock.length,
        lowStock,
        recentMovements,
      },
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Gagal mengambil ringkasan' });
  }
};

// GET /api/inventory/low-stock
export const getLowStock = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: req.user.organizationId,
        status: 'active',
        minimumStock: { gt: 0 },
      },
      include: {
        warehouseStocks: {
          select: { quantity: true, warehouse: { select: { name: true } } },
        },
        category: { select: { name: true } },
      },
    });

    const lowStockProducts = products
      .map((p) => ({
        ...p,
        totalStock: p.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
      }))
      .filter((p) => p.totalStock < p.minimumStock)
      .sort((a, b) => (a.totalStock / a.minimumStock) - (b.totalStock / b.minimumStock));

    res.json({ products: lowStockProducts });
  } catch (err) {
    console.error('Get low stock error:', err);
    res.status(500).json({ error: 'Gagal mengambil data stok rendah' });
  }
};
