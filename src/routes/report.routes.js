import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getInventoryReport,
  getMovementsReport,
  getScansReport,
  getDetectionPerformance,
  exportReport,
} from '../controllers/report.controller.js';

const router = Router();

router.use(authenticate);

router.get('/inventory', getInventoryReport);
router.get('/movements', getMovementsReport);
router.get('/scans', getScansReport);
router.get('/detection-performance', getDetectionPerformance);
router.get('/export', exportReport);

export default router;
