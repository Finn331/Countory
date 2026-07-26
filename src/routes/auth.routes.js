import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validator.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, organizationName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let organizationId = null;
    if (organizationName) {
      const org = await prisma.organization.create({
        data: { name: organizationName },
      });
      organizationId = org.id;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId,
        role: organizationName ? 'admin' : 'staff',
      },
    });

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal melakukan registrasi' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Akun tidak aktif' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal melakukan login' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
});

export default router;
