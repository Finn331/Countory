import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getMovements,
  stockIn,
  stockOut,
  adjustment,
  getSummary,
  getLowStock,
} from '../controllers/inventory.controller.js';

const router = Router();

router.use(authenticate);

const validateStockIn = [
  body('productId').isInt().withMessage('Produk wajib dipilih'),
  body('warehouseId').isInt().withMessage('Gudang wajib dipilih'),
  body('quantity').isInt({ min: 1 }).withMessage('Jumlah minimal 1'),
];

const validateStockOut = [
  body('productId').isInt().withMessage('Produk wajib dipilih'),
  body('warehouseId').isInt().withMessage('Gudang wajib dipilih'),
  body('quantity').isInt({ min: 1 }).withMessage('Jumlah minimal 1'),
];

const validateAdjustment = [
  body('productId').isInt().withMessage('Produk wajib dipilih'),
  body('warehouseId').isInt().withMessage('Gudang wajib dipilih'),
  body('newQuantity').isInt({ min: 0 }).withMessage('Jumlah baru tidak boleh negatif'),
];

router.get('/movements', getMovements);
router.get('/summary', getSummary);
router.get('/low-stock', authorize('admin', 'manager'), getLowStock);
router.post('/stock-in', authorize('admin', 'manager', 'staff'), validateStockIn, stockIn);
router.post('/stock-out', authorize('admin', 'manager', 'staff'), validateStockOut, stockOut);
router.post('/adjustment', authorize('admin', 'manager'), validateAdjustment, adjustment);

export default router;
