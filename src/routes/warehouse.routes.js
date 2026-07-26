import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../controllers/warehouse.controller.js';

const router = Router();

router.use(authenticate);

const validateWarehouse = [
  body('name').trim().notEmpty().withMessage('Nama gudang wajib diisi'),
  body('code').trim().notEmpty().withMessage('Kode gudang wajib diisi'),
  body('address').optional().trim(),
];

router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.post('/', authorize('admin', 'manager'), validateWarehouse, createWarehouse);
router.put('/:id', authorize('admin', 'manager'), validateWarehouse, updateWarehouse);
router.delete('/:id', authorize('admin'), deleteWarehouse);

export default router;
