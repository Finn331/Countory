import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import {
  getScans,
  createScan,
  syncScans,
  getScan,
} from '../controllers/scan.controller.js';

const router = Router();

router.use(authenticate);

const validateScan = [
  body('productId').isInt().withMessage('Produk wajib dipilih'),
  body('warehouseId').isInt().withMessage('Gudang wajib dipilih'),
  body('transactionType').isIn(['stock_in', 'stock_out', 'opname']).withMessage('Jenis transaksi tidak valid'),
  body('detectedCount').optional().isInt({ min: 0 }),
  body('confirmedCount').optional().isInt({ min: 0 }),
];

router.get('/', getScans);
router.get('/:id', getScan);
router.post('/', validateScan, createScan);
router.post('/sync', syncScans);

export default router;
