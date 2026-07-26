import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId: req.user.organizationId,
        role: role || 'staff',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'Pengguna berhasil dibuat', user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Gagal membuat pengguna' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    if (user.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, role, status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'Pengguna berhasil diperbarui', user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Gagal memperbarui pengguna' });
  }
};

// PATCH /api/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    res.json({ message: 'Status pengguna diperbarui', user });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ error: 'Gagal memperbarui status' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    if (user.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    if (user.id === req.user.id) {
      return res.status(409).json({ error: 'Tidak dapat menghapus akun sendiri' });
    }

    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
};

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });

    res.json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Gagal memperbarui notifikasi' });
  }
};

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Gagal memperbarui notifikasi' });
  }
};

// GET /api/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resourceType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      user: { organizationId: req.user.organizationId },
      ...(action && { action }),
      ...(resourceType && { resourceType }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Gagal mengambil log audit' });
  }
};

// Helper: Create audit log
export const createAuditLog = async (userId, action, resourceType, resourceId, oldData, newData, req) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId: resourceId ? parseInt(resourceId) : null,
        oldData: oldData || null,
        newData: newData || null,
        ipAddress: req?.ip || null,
        userAgent: req?.get('User-Agent') || null,
      },
    });
  } catch (err) {
    console.error('Create audit log error:', err);
  }
};

// GET /api/reports/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const [totalProducts, totalWarehouses, totalUsers, stockSummary, recentMovements, lowStockCount] = await Promise.all([
      prisma.product.count({ where: { organizationId: orgId, status: 'active' } }),
      prisma.warehouse.count({ where: { organizationId: orgId, status: 'active' } }),
      prisma.user.count({ where: { organizationId: orgId, status: 'active' } }),
      prisma.warehouseStock.aggregate({
        where: { product: { organizationId: orgId } },
        _sum: { quantity: true },
      }),
      prisma.inventoryMovement.findMany({
        where: { product: { organizationId: orgId } },
        include: {
          product: { select: { name: true } },
          warehouse: { select: { name: true } },
          user: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: {
          organizationId: orgId,
          status: 'active',
          minimumStock: { gt: 0 },
        },
      }),
    ]);

    res.json({
      stats: {
        totalProducts,
        totalWarehouses,
        totalUsers,
        totalStock: stockSummary._sum.quantity || 0,
        lowStockCount,
      },
      recentMovements,
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
  }
};

// Helper: Create notification
export const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type },
    });
  } catch (err) {
    console.error('Create notification error:', err);
  }
};

// Helper: Check low stock and create notifications
export const checkLowStock = async (organizationId) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId,
        status: 'active',
        minimumStock: { gt: 0 },
      },
      include: { warehouseStocks: { select: { quantity: true } } },
    });

    for (const product of products) {
      const totalStock = product.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0);
      if (totalStock < product.minimumStock) {
        const users = await prisma.user.findMany({
          where: { organizationId, role: { in: ['admin', 'manager'] }, status: 'active' },
        });

        for (const user of users) {
          await createNotification(
            user.id,
            'Stok Rendah',
            `Produk "${product.name}" memiliki stok rendah: ${totalStock} unit`,
            'warning'
          );
        }
      }
    }
  } catch (err) {
    console.error('Check low stock error:', err);
  }
};
