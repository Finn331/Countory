import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getTransfers,
  createTransfer,
  sendTransfer,
  receiveTransfer,
  cancelTransfer,
} from '../controllers/transfer.controller.js';

const router = Router();

router.use(authenticate);

const validateTransfer = [
  body('sourceWarehouseId').isInt().withMessage('Gudang sumber wajib dipilih'),
  body('destinationWarehouseId').isInt().withMessage('Gudang tujuan wajib dipilih'),
  body('items').isArray({ min: 1 }).withMessage('Minimal 1 item'),
];

router.get('/', getTransfers);
router.post('/', authorize('admin', 'manager'), validateTransfer, createTransfer);
router.post('/:id/send', authorize('admin', 'manager'), sendTransfer);
router.post('/:id/receive', authorize('admin', 'manager'), receiveTransfer);
router.post('/:id/cancel', authorize('admin', 'manager'), cancelTransfer);

export default router;
