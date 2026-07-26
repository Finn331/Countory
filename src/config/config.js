const config = {
  app: {
    name: 'Countory',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

export default config;
