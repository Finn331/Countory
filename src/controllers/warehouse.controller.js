import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/warehouses
export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        _count: { select: { warehouseStocks: true } },
        warehouseStocks: {
          select: { quantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const warehousesWithStats = warehouses.map((w) => ({
      ...w,
      totalProducts: w._count.warehouseStocks,
      totalStock: w.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
    }));

    res.json({ warehouses: warehousesWithStats });
  } catch (err) {
    console.error('Get warehouses error:', err);
    res.status(500).json({ error: 'Gagal mengambil data gudang' });
  }
};

// GET /api/warehouses/:id
export const getWarehouse = async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        warehouseStocks: {
          include: {
            product: {
              include: { category: { select: { name: true } } },
            },
          },
          orderBy: { quantity: 'desc' },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Gudang tidak ditemukan' });
    }

    if (warehouse.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    res.json({ warehouse });
  } catch (err) {
    console.error('Get warehouse error:', err);
    res.status(500).json({ error: 'Gagal mengambil data gudang' });
  }
};

// POST /api/warehouses
export const createWarehouse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, code, address, managerId } = req.body;

    const existingCode = await prisma.warehouse.findFirst({
      where: {
        organizationId: req.user.organizationId,
        code,
      },
    });

    if (existingCode) {
      return res.status(409).json({ error: 'Kode gudang sudah digunakan' });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: req.user.organizationId,
        name,
        code,
        address: address || null,
        managerId: managerId ? parseInt(managerId) : null,
      },
    });

    res.status(201).json({ message: 'Gudang berhasil dibuat', warehouse });
  } catch (err) {
    console.error('Create warehouse error:', err);
    res.status(500).json({ error: 'Gagal membuat gudang' });
  }
};

// PUT /api/warehouses/:id
export const updateWarehouse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, code, address, managerId, status } = req.body;

    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingWarehouse) {
      return res.status(404).json({ error: 'Gudang tidak ditemukan' });
    }

    if (existingWarehouse.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (code && code !== existingWarehouse.code) {
      const codeExists = await prisma.warehouse.findFirst({
        where: {
          organizationId: req.user.organizationId,
          code,
          id: { not: parseInt(id) },
        },
      });
      if (codeExists) {
        return res.status(409).json({ error: 'Kode gudang sudah digunakan' });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        address,
        managerId: managerId ? parseInt(managerId) : null,
        status,
      },
    });

    res.json({ message: 'Gudang berhasil diperbarui', warehouse });
  } catch (err) {
    console.error('Update warehouse error:', err);
    res.status(500).json({ error: 'Gagal memperbarui gudang' });
  }
};

// DELETE /api/warehouses/:id
export const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { warehouseStocks: true } } },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Gudang tidak ditemukan' });
    }

    if (warehouse.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (warehouse._count.warehouseStocks > 0) {
      return res.status(409).json({
        error: 'Tidak dapat menghapus gudang yang masih memiliki stok',
      });
    }

    await prisma.warehouse.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Gudang berhasil dihapus' });
  } catch (err) {
    console.error('Delete warehouse error:', err);
    res.status(500).json({ error: 'Gagal menghapus gudang' });
  }
};
