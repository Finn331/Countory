import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
      }
      return res.redirect('/login');
    }

    if (!roles.includes(req.user.role)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Tidak memiliki akses' });
      }
      return res.status(403).render('pages/errors/403', {
        title: '403 - Akses Ditolak',
        layout: 'layouts/main',
      });
    }

    next();
  };
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};
