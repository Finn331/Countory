import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const prisma = new PrismaClient();

// ==================== CONFIGURATION ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('env', process.env.NODE_ENV || 'development');
app.disable('x-powered-by');

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==================== GENERAL MIDDLEWARE ====================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak request, silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Terlalu banyak percobaan login, silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==================== REQUEST LOGGING ====================
if (app.get('env') === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };
      console.log(JSON.stringify(log));
    });
    next();
  });
}

// ==================== MAKE PRISMA AVAILABLE ====================
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// ==================== ROUTES ====================
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import scanRoutes from './routes/scan.routes.js';
import detectionRoutes from './routes/detection.routes.js';
import opnameRoutes from './routes/opname.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportRoutes from './routes/report.routes.js';

app.get('/', (req, res) => {
  res.render('pages/landing', {
    title: 'Countory - Inventory Management System',
    layout: 'layouts/main',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api', detectionRoutes);
app.use('/api/stock-opnames', opnameRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api', adminRoutes);
app.use('/api/reports', reportRoutes);

// Dashboard Routes
app.use('/dashboard', dashboardRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).render('pages/errors/404', {
    title: '404 - Halaman Tidak Ditemukan',
    layout: 'layouts/main',
    url: req.url,
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = app.get('env') === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(status).render('pages/errors/500', {
    title: '500 - Kesalahan Server',
    layout: 'layouts/main',
    message,
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${app.get('env')}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
