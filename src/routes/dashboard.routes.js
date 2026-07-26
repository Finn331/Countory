import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.render('pages/dashboard/index', {
    title: 'Dashboard - Countory',
    layout: 'layouts/dashboard',
    user: req.user,
  });
});

export default router;
