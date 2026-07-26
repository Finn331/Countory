import ejs from 'ejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsDir = path.join(__dirname, '..', '..', 'views');

export const renderWithLayout = (res, view, data = {}, layout = 'layouts/main') => {
  const viewPath = path.join(viewsDir, `${view}.ejs`);
  const layoutPath = path.join(viewsDir, `${layout}.ejs`);

  ejs.renderFile(viewPath, data, (err, body) => {
    if (err) {
      console.error('View render error:', err);
      return res.status(500).render('pages/errors/500', {
        title: '500 - Error',
        layout: 'layouts/main',
        message: err.message,
      });
    }

    ejs.renderFile(layoutPath, { ...data, body }, (err, html) => {
      if (err) {
        console.error('Layout render error:', err);
        return res.status(500).render('pages/errors/500', {
          title: '500 - Error',
          layout: 'layouts/main',
          message: err.message,
        });
      }
      res.send(html);
    });
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
