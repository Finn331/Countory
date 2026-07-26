// EJS Helpers for templates
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '-';
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

export const statusBadge = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    synced: 'bg-green-100 text-green-700',
    conflict: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
};
