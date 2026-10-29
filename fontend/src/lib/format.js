export const AVC = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#06b6d4', '#6366f1', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16', '#a855f7', '#fb923c', '#22d3ee', '#e879f9', '#4ade80', '#f43f5e', '#60a5fa', '#fbbf24'];

export const pad = (n) => String(n).padStart(2, '0');
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const curMonth = () => todayStr().slice(0, 7);
export const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
export const fmt = (n) => Number(Math.round(Number(n) || 0)).toLocaleString('vi-VN');
export const fmtScore = (n) => String(Math.round((Number(n) || 0) * 10) / 10);
export const initials = (name) => {
  const p = String(name || '?').trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};
export const avColor = (i) => AVC[Math.abs(Number(i) || 0) % AVC.length];
