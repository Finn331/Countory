import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Helper: Check if opname belongs to user's organization
const checkOpnameOrg = async (opnameId, organizationId) => {
  const opname = await prisma.stockOpname.findUnique({
    where: { id: parseInt(opnameId) },
    include: { warehouse: { select: { organizationId: true } } },
  });
  return opname && opname.warehouse.organizationId === organizationId;
};

// GET /api/stock-opnames
export const getStockOpnames = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, warehouseId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      warehouse: { organizationId: req.user.organizationId },
      ...(status && { status }),
      ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
    };

    const [opnames, total] = await Promise.all([
      prisma.stockOpname.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          items: { select: { id: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockOpname.count({ where }),
    ]);

    res.json({
      opnames: opnames.map((o) => ({
        ...o,
        itemCount: o.items.length,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get stock opnames error:', err);
    res.status(500).json({ error: 'Gagal mengambil data stock opname' });
  }
};

// POST /api/stock-opnames
export const createStockOpname = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { warehouseId, name, notes } = req.body;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
    });

    if (!warehouse || warehouse.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Gudang tidak ditemukan' });
    }

    const opname = await prisma.stockOpname.create({
      data: {
        warehouseId: parseInt(warehouseId),
        name,
        assignedTo: req.user.id,
        notes: notes || null,
      },
      include: { warehouse: { select: { name: true } } },
    });

    res.status(201).json({ message: 'Stock opname berhasil dibuat', opname });
  } catch (err) {
    console.error('Create stock opname error:', err);
    res.status(500).json({ error: 'Gagal membuat stock opname' });
  }
};

// POST /api/stock-opnames/:id/items
export const addOpnameItem = async (req, res) => {
  try {
    const hasAccess = await checkOpnameOrg(req.params.id, req.user.organizationId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Stock opname tidak ditemukan' });
    }

    const opname = await prisma.stockOpname.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (opname.status !== 'draft' && opname.status !== 'in_progress') {
      return res.status(409).json({ error: 'Stock opname sudah diproses' });
    }

    const { productId, detectedQuantity, reason, imageUrl } = req.body;

    // Get system quantity
    const warehouseStock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: opname.warehouseId,
          productId: parseInt(productId),
        },
      },
    });

    const systemQuantity = warehouseStock?.quantity || 0;

    const item = await prisma.stockOpnameItem.upsert({
      where: {
        stockOpnameId_productId: {
          stockOpnameId: parseInt(req.params.id),
          productId: parseInt(productId),
        },
      },
      update: {
        detectedQuantity: parseInt(detectedQuantity),
        difference: parseInt(detectedQuantity) - systemQuantity,
        reason: reason || null,
        imageUrl: imageUrl || null,
        status: 'counted',
      },
      create: {
        stockOpnameId: parseInt(req.params.id),
        productId: parseInt(productId),
        systemQuantity,
        detectedQuantity: parseInt(detectedQuantity),
        difference: parseInt(detectedQuantity) - systemQuantity,
        reason: reason || null,
        imageUrl: imageUrl || null,
        status: 'counted',
      },
    });

    // Update opname status
    await prisma.stockOpname.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'in_progress' },
    });

    res.status(201).json({ message: 'Item opname berhasil ditambahkan', item });
  } catch (err) {
    console.error('Add opname item error:', err);
    res.status(500).json({ error: 'Gagal menambahkan item opname' });
  }
};

// POST /api/stock-opnames/:id/submit
export const submitOpname = async (req, res) => {
  try {
    const hasAccess = await checkOpnameOrg(req.params.id, req.user.organizationId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Stock opname tidak ditemukan' });
    }

    const opname = await prisma.stockOpname.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    if (opname.status !== 'in_progress') {
      return res.status(409).json({ error: 'Stock opname harus dalam status in_progress' });
    }

    await prisma.stockOpname.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'submitted',
        completedAt: new Date(),
      },
    });

    res.json({ message: 'Stock opname berhasil disubmit' });
  } catch (err) {
    console.error('Submit opname error:', err);
    res.status(500).json({ error: 'Gagal mensubmit stock opname' });
  }
};

// POST /api/stock-opnames/:id/approve
export const approveOpname = async (req, res) => {
  try {
    const hasAccess = await checkOpnameOrg(req.params.id, req.user.organizationId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Stock opname tidak ditemukan' });
    }

    const opname = await prisma.stockOpname.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    if (opname.status !== 'submitted') {
      return res.status(409).json({ error: 'Stock opname harus dalam status submitted' });
    }

    // Apply adjustments
    await prisma.$transaction(async (tx) => {
      for (const item of opname.items) {
        const confirmedQty = item.confirmedQuantity || item.detectedQuantity;

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: opname.warehouseId,
              productId: item.productId,
            },
          },
          update: { quantity: confirmedQty },
          create: {
            warehouseId: opname.warehouseId,
            productId: item.productId,
            quantity: confirmedQty,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: opname.warehouseId,
            userId: req.user.id,
            movementType: 'adjustment',
            quantity: Math.abs(confirmedQty - item.systemQuantity),
            previousStock: item.systemQuantity,
            currentStock: confirmedQty,
            notes: `Stock opname: ${opname.name}`,
          },
        });

        await tx.stockOpnameItem.update({
          where: { id: item.id },
          data: { status: 'adjusted' },
        });
      }

      await tx.stockOpname.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'approved',
          approvedBy: req.user.id,
        },
      });
    });

    res.json({ message: 'Stock opname berhasil disetujui' });
  } catch (err) {
    console.error('Approve opname error:', err);
    res.status(500).json({ error: 'Gagal menyetujui stock opname' });
  }
};

// DELETE /api/stock-opnames/:id
export const deleteOpname = async (req, res) => {
  try {
    const hasAccess = await checkOpnameOrg(req.params.id, req.user.organizationId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Stock opname tidak ditemukan' });
    }

    const opname = await prisma.stockOpname.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (opname.status === 'approved') {
      return res.status(409).json({ error: 'Tidak dapat menghapus opname yang sudah disetujui' });
    }

    await prisma.stockOpnameItem.deleteMany({
      where: { stockOpnameId: parseInt(req.params.id) },
    });

    await prisma.stockOpname.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Stock opname berhasil dihapus' });
  } catch (err) {
    console.error('Delete opname error:', err);
    res.status(500).json({ error: 'Gagal menghapus stock opname' });
  }
};
