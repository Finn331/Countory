import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  getDashboardStats,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);

// Dashboard stats
router.get('/reports/dashboard', getDashboardStats);

// Users
router.get('/users', authorize('admin'), getUsers);
router.post('/users', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
], createUser);
router.put('/users/:id', authorize('admin'), updateUser);
router.patch('/users/:id/status', authorize('admin'), updateUserStatus);
router.delete('/users/:id', authorize('admin'), deleteUser);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// Audit logs
router.get('/audit-logs', authorize('admin'), getAuditLogs);

export default router;
