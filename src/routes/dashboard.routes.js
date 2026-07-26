import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Dashboard
router.get('/', (req, res) => {
  res.render('pages/dashboard/index', {
    title: 'Dashboard - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Products
router.get('/products', (req, res) => {
  res.render('pages/products/index', {
    title: 'Produk - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Categories
router.get('/categories', (req, res) => {
  res.render('pages/categories/index', {
    title: 'Kategori - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Warehouses
router.get('/warehouses', (req, res) => {
  res.render('pages/warehouses/index', {
    title: 'Gudang - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Scan
router.get('/scan', (req, res) => {
  res.render('pages/scan/index', {
    title: 'Scan Barang - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Calibration
router.get('/calibration', (req, res) => {
  res.render('pages/scan/calibration', {
    title: 'Kalibrasi Deteksi AI - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Stock In
router.get('/stock-in', (req, res) => {
  res.render('pages/inventory/stock-in', {
    title: 'Stok Masuk - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Stock Out
router.get('/stock-out', (req, res) => {
  res.render('pages/inventory/stock-out', {
    title: 'Stok Keluar - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Stock Opname
router.get('/opname', (req, res) => {
  res.render('pages/inventory/opname', {
    title: 'Stock Opname - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Transfers
router.get('/transfers', (req, res) => {
  res.render('pages/inventory/transfers', {
    title: 'Transfer Stok - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Reports
router.get('/reports', (req, res) => {
  res.render('pages/reports/index', {
    title: 'Laporan - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Notifications
router.get('/notifications', (req, res) => {
  res.render('pages/admin/notifications', {
    title: 'Notifikasi - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Settings
router.get('/settings', (req, res) => {
  res.render('pages/admin/settings', {
    title: 'Pengaturan - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// Users
router.get('/users', (req, res) => {
  res.render('pages/admin/users', {
    title: 'Manajemen Pengguna - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

// Audit Logs
router.get('/audit-logs', (req, res) => {
  res.render('pages/admin/audit-logs', {
    title: 'Audit Log Sistem - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

export default router;
