// Logic THUẦN của KPI. Điểm tổng chính thức do BACKEND tính từ đầu việc; client dùng cùng công thức để xem trước.
import { pad } from '../../lib/format';
import { dayOf } from '../tasks/taskUtils';

// Khớp backend/src/services/kpi.service.js
export const WEIGHTS = { completion: 0.4, onTime: 0.3, quality: 0.3 };

export const CRITERIA = [
  { key: 'completionRate', label: 'Hoàn thành', weight: WEIGHTS.completion },
  { key: 'onTimeRate', label: 'Đúng hạn', weight: WEIGHTS.onTime },
  { key: 'qualityScore', label: 'Chất lượng', weight: WEIGHTS.quality },
];

export const rankOf = (s) => (s >= 90 ? { lbl: 'Xuất sắc', cls: 'badge-success' }
  : s >= 80 ? { lbl: 'Tốt', cls: 'badge-info' }
    : s >= 70 ? { lbl: 'Khá', cls: 'badge-warning' } : { lbl: 'Cần cải thiện', cls: 'badge-danger' });

const round2 = (n) => Math.round(n * 100) / 100;
const sumW = (list) => list.reduce((s, t) => s + (t.weight || 1), 0);

/** Cùng công thức backend: việc hủy bỏ qua; tỉ lệ theo trọng số. */
export function computeFromTasks(tasks) {
  const active = tasks.filter((t) => t.status !== 'CANCELLED');
  if (!active.length) return null;
  const done = active.filter((t) => t.status === 'DONE');
  const onTime = done.filter((t) => t.completedAt && dayOf(t.completedAt) <= dayOf(t.dueDate));
  const W = sumW(active);
  const Wd = sumW(done);
  const completionRate = W ? (Wd / W) * 100 : 0;
  const onTimeRate = Wd ? (sumW(onTime) / Wd) * 100 : 0;
  const qualityScore = Wd ? done.reduce((s, t) => s + (t.weight || 1) * (t.quality || 0), 0) / Wd : 0;
  const total = completionRate * WEIGHTS.completion + onTimeRate * WEIGHTS.onTime + qualityScore * WEIGHTS.quality;
  return {
    totalTasks: active.length,
    doneTasks: done.length,
    onTimeTasks: onTime.length,
    completionRate: round2(completionRate),
    onTimeRate: round2(onTimeRate),
    qualityScore: round2(qualityScore),
    total: round2(total),
  };
}

export const contributionsOf = (stats) => CRITERIA.map((c) => ({
  ...c,
  score: stats ? stats[c.key] : 0,
  points: stats ? round2(stats[c.key] * c.weight) : 0,
}));

// 12 kỳ gần nhất, mới nhất trước (backend chưa có API liệt kê kỳ)
export function recentPeriods(count = 12, now = new Date()) {
  let y = now.getFullYear(); let m = now.getMonth() + 1;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(`${y}-${pad(m)}`);
    m -= 1; if (m === 0) { m = 12; y -= 1; }
  }
  return out;
}

// Mọi nhân viên trong phạm vi xem; người chưa có KPI (chưa có việc) xếp cuối
export function buildRanking(emps, records) {
  const byEmp = {};
  records.forEach((k) => { byEmp[k.employeeId] = k; });
  return emps.map((e) => ({ e, rec: byEmp[e.id] || null }))
    .sort((a, b) => (b.rec ? b.rec.total : -1) - (a.rec ? a.rec.total : -1))
    .map((r, i) => ({ ...r, pos: i + 1 }));
}

export function deptAverages(ranked, colorOf) {
  const map = new Map();
  ranked.filter((r) => r.rec).forEach((r) => {
    const name = r.e.department ? r.e.department.name : 'Chưa có';
    const cur = map.get(name) || { sum: 0, count: 0, color: colorOf(r.e.department) };
    cur.sum += r.rec.total; cur.count += 1;
    map.set(name, cur);
  });
  return [...map].map(([name, v]) => ({ name, avg: Math.round(v.sum / v.count), color: v.color }));
}

export const topThree = (ranked) => ranked.filter((r) => r.rec).slice(0, 3);
export const progressColor = (k) => (k >= 80 ? 'var(--success)' : k >= 70 ? 'var(--warning)' : 'var(--danger)');

export function kpiCsvRows(ranked) {
  const rows = [['Hạng', 'Mã NV', 'Họ tên', 'Phòng ban', 'Số việc', 'Đã xong', 'Đúng hạn', 'Hoàn thành %', 'Đúng hạn %', 'Chất lượng', 'Điểm KPI', 'Xếp loại']];
  ranked.forEach((r, i) => rows.push([
    i + 1, r.e.employeeCode, r.e.name, r.e.department ? r.e.department.name : '',
    r.rec ? r.rec.totalTasks : 0, r.rec ? r.rec.doneTasks : 0, r.rec ? r.rec.onTimeTasks : 0,
    r.rec ? r.rec.completionRate : '', r.rec ? r.rec.onTimeRate : '', r.rec ? r.rec.qualityScore : '',
    r.rec ? r.rec.total : '', r.rec ? rankOf(r.rec.total).lbl : 'Chưa có việc',
  ]));
  return rows;
}

export const rankKeyOf = (rec) => (!rec ? 'none' : rec.total >= 90 ? 'excellent' : rec.total >= 80 ? 'good' : rec.total >= 70 ? 'fair' : 'poor');

export const RANK_FILTERS = [
  { key: '', label: 'Tất cả' }, { key: 'excellent', label: 'Xuất sắc' }, { key: 'good', label: 'Tốt' },
  { key: 'fair', label: 'Khá' }, { key: 'poor', label: 'Cần cải thiện' }, { key: 'none', label: 'Chưa có việc' },
];

export function rankCounts(ranked) {
  const c = { '': ranked.length, excellent: 0, good: 0, fair: 0, poor: 0, none: 0 };
  ranked.forEach((r) => { c[rankKeyOf(r.rec)] += 1; });
  return c;
}

export function kpiSummary(ranked) {
  const rated = ranked.filter((r) => r.rec);
  const c = rankCounts(ranked);
  return {
    avg: rated.length ? rated.reduce((a, r) => a + r.rec.total, 0) / rated.length : null,
    rated: rated.length, total: ranked.length, excellent: c.excellent, poor: c.poor,
  };
}

export function filterRanking(ranked, { q = '', dept = '', rank = '' } = {}) {
  const needle = q.toLowerCase().trim();
  return ranked.filter((r) => {
    if (dept && String(r.e.department ? r.e.department.id : '') !== String(dept)) return false;
    if (rank && rankKeyOf(r.rec) !== rank) return false;
    if (needle && !(r.e.name.toLowerCase().includes(needle) || (r.e.employeeCode || '').toLowerCase().includes(needle))) return false;
    return true;
  });
}
