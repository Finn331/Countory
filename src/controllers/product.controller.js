import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', categoryId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      organizationId: req.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(status && { status }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          warehouseStocks: {
            select: { quantity: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
    }));

    res.json({
      products: productsWithStock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};

// GET /api/products/:id
export const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        warehouseStocks: {
          include: { warehouse: true },
        },
        detectionProfiles: true,
        inventoryMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    if (product.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    res.json({ product });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, sku, barcode, categoryId, unit, description, minimumStock, maximumStock } = req.body;

    const existingSku = await prisma.product.findFirst({
      where: {
        organizationId: req.user.organizationId,
        sku,
      },
    });

    if (existingSku) {
      return res.status(409).json({ error: 'SKU sudah digunakan' });
    }

    if (barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: {
          organizationId: req.user.organizationId,
          barcode,
        },
      });
      if (existingBarcode) {
        return res.status(409).json({ error: 'Barcode sudah digunakan' });
      }
    }

    const product = await prisma.product.create({
      data: {
        organizationId: req.user.organizationId,
        name,
        sku,
        barcode: barcode || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        unit: unit || 'pcs',
        description: description || null,
        minimumStock: parseInt(minimumStock) || 0,
        maximumStock: parseInt(maximumStock) || 0,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Produk berhasil dibuat', product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Gagal membuat produk' });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, sku, barcode, categoryId, unit, description, minimumStock, maximumStock, status } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    if (existingProduct.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          organizationId: req.user.organizationId,
          sku,
          id: { not: parseInt(id) },
        },
      });
      if (skuExists) {
        return res.status(409).json({ error: 'SKU sudah digunakan' });
      }
    }

    if (barcode && barcode !== existingProduct.barcode) {
      const barcodeExists = await prisma.product.findFirst({
        where: {
          organizationId: req.user.organizationId,
          barcode,
          id: { not: parseInt(id) },
        },
      });
      if (barcodeExists) {
        return res.status(409).json({ error: 'Barcode sudah digunakan' });
      }
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        sku,
        barcode: barcode || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        unit,
        description,
        minimumStock: parseInt(minimumStock) || 0,
        maximumStock: parseInt(maximumStock) || 0,
        status,
      },
      include: { category: true },
    });

    res.json({ message: 'Produk berhasil diperbarui', product });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Gagal memperbarui produk' });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    if (product.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    await prisma.product.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
};

// GET /api/products/barcode/:barcode
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        organizationId: req.user.organizationId,
        barcode: req.params.barcode,
        status: 'active',
      },
      include: {
        category: { select: { name: true } },
        warehouseStocks: {
          include: { warehouse: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json({ product });
  } catch (err) {
    console.error('Get product by barcode error:', err);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};
