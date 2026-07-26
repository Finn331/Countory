import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getStockOpnames,
  createStockOpname,
  addOpnameItem,
  submitOpname,
  approveOpname,
  deleteOpname,
} from '../controllers/opname.controller.js';

const router = Router();

router.use(authenticate);

const validateOpname = [
  body('warehouseId').isInt().withMessage('Gudang wajib dipilih'),
  body('name').trim().notEmpty().withMessage('Nama opname wajib diisi'),
];

router.get('/', getStockOpnames);
router.post('/', authorize('admin', 'manager'), validateOpname, createStockOpname);
router.post('/:id/items', authorize('admin', 'manager', 'staff'), addOpnameItem);
router.post('/:id/submit', authorize('admin', 'manager'), submitOpname);
router.post('/:id/approve', authorize('admin'), approveOpname);
router.delete('/:id', authorize('admin'), deleteOpname);

export default router;
