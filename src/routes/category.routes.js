import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';

const router = Router();

router.use(authenticate);

const validateCategory = [
  body('name').trim().notEmpty().withMessage('Nama kategori wajib diisi'),
  body('code').trim().notEmpty().withMessage('Kode kategori wajib diisi'),
  body('description').optional().trim(),
];

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', authorize('admin', 'manager'), validateCategory, createCategory);
router.put('/:id', authorize('admin', 'manager'), validateCategory, updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

export default router;
