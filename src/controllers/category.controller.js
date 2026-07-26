import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
};

// GET /api/categories/:id
export const getCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        products: {
          take: 20,
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    if (category.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    res.json({ category });
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, code, description, icon } = req.body;

    const existingCode = await prisma.category.findFirst({
      where: {
        organizationId: req.user.organizationId,
        code,
      },
    });

    if (existingCode) {
      return res.status(409).json({ error: 'Kode kategori sudah digunakan' });
    }

    const category = await prisma.category.create({
      data: {
        organizationId: req.user.organizationId,
        name,
        code,
        description: description || null,
        icon: icon || null,
      },
    });

    res.status(201).json({ message: 'Kategori berhasil dibuat', category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, code, description, icon, status } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    if (existingCategory.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (code && code !== existingCategory.code) {
      const codeExists = await prisma.category.findFirst({
        where: {
          organizationId: req.user.organizationId,
          code,
          id: { not: parseInt(id) },
        },
      });
      if (codeExists) {
        return res.status(409).json({ error: 'Kode kategori sudah digunakan' });
      }
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        description,
        icon,
        status,
      },
    });

    res.json({ message: 'Kategori berhasil diperbarui', category });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Gagal memperbarui kategori' });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    if (category.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (category._count.products > 0) {
      return res.status(409).json({
        error: 'Tidak dapat menghapus kategori yang masih memiliki produk',
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
};
