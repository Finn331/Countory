import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
} from '../controllers/product.controller.js';

const router = Router();

router.use(authenticate);

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Nama produk wajib diisi'),
  body('sku').trim().notEmpty().withMessage('SKU wajib diisi'),
  body('categoryId').optional({ values: 'null' }).isInt().withMessage('Kategori harus berupa angka'),
  body('unit').optional().trim().notEmpty(),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Stok minimum tidak boleh negatif'),
  body('maximumStock').optional().isInt({ min: 0 }).withMessage('Stok maksimum tidak boleh negatif'),
];

router.get('/', getProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'manager'), validateProduct, createProduct);
router.put('/:id', authorize('admin', 'manager'), validateProduct, updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
