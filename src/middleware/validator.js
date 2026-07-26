import { body, param, query, validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.path.startsWith('/api/')) {
      return res.status(422).json({
        error: 'Validasi gagal',
        details: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }
    return res.status(422).render('pages/errors/422', {
      title: '422 - Validasi Gagal',
      layout: 'layouts/main',
      errors: errors.array(),
    });
  }
  next();
};

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Format email tidak valid'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
  body('organizationName').optional().trim().notEmpty().withMessage('Nama organisasi tidak boleh kosong'),
  handleValidation,
];

export const validateLogin = [
  body('email').isEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
  handleValidation,
];

export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Nama produk wajib diisi'),
  body('sku').trim().notEmpty().withMessage('SKU wajib diisi'),
  body('categoryId').optional().isInt().withMessage('Kategori harus berupa angka'),
  body('unit').optional().trim().notEmpty(),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Stok minimum tidak boleh negatif'),
  body('maximumStock').optional().isInt({ min: 0 }).withMessage('Stok maksimum tidak boleh negatif'),
  handleValidation,
];

export const validateWarehouse = [
  body('name').trim().notEmpty().withMessage('Nama gudang wajib diisi'),
  body('code').trim().notEmpty().withMessage('Kode gudang wajib diisi'),
  body('address').optional().trim(),
  handleValidation,
];

export const validateCategory = [
  body('name').trim().notEmpty().withMessage('Nama kategori wajib diisi'),
  body('code').trim().notEmpty().withMessage('Kode kategori wajib diisi'),
  body('description').optional().trim(),
  handleValidation,
];

export const validateIdParam = [
  param('id').isInt().withMessage('ID harus berupa angka'),
  handleValidation,
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Halaman harus angka positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus antara 1-100'),
  handleValidation,
];
