import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDetectionProfiles,
  createDetectionProfile,
  updateDetectionProfile,
  activateProfile,
  deleteDetectionProfile,
} from '../controllers/detection.controller.js';

const router = Router();

router.use(authenticate);

const validateProfile = [
  body('name').trim().notEmpty().withMessage('Nama profil wajib diisi'),
  body('minArea').optional().isFloat({ min: 0 }),
  body('maxArea').optional().isFloat({ min: 0 }),
  body('thresholdValue').optional().isInt({ min: 0, max: 255 }),
  body('blurKernel').optional().isInt({ min: 1, max: 31 }),
];

router.get('/products/:id/detection-profiles', getDetectionProfiles);
router.post('/products/:id/detection-profiles', authorize('admin', 'manager'), validateProfile, createDetectionProfile);
router.put('/:id', authorize('admin', 'manager'), validateProfile, updateDetectionProfile);
router.post('/:id/activate', authorize('admin', 'manager'), activateProfile);
router.delete('/:id', authorize('admin'), deleteDetectionProfile);

export default router;
