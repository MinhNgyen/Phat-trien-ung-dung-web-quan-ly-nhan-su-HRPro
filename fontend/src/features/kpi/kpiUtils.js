// Logic THUẦN của tính năng KPI. Điểm tổng chính thức do BACKEND tính; client chỉ hiển thị và xem trước khi nhập.
import { pad } from '../../lib/format';

// Trọng số khớp với backend (kpi.controller.js)
export const CRITERIA = [
  { key: 'sales', label: 'Doanh số / kết quả', weight: 0.25 },
  { key: 'attendance', label: 'Chuyên cần', weight: 0.20 },
  { key: 'task', label: 'Hoàn thành công việc', weight: 0.25 },
  { key: 'deadline', label: 'Đúng deadline', weight: 0.15 },
  { key: 'quality', label: 'Chất lượng', weight: 0.15 },
];

export const rankOf = (s) => (s >= 90 ? { lbl: 'Xuất sắc', cls: 'badge-success' }
  : s >= 80 ? { lbl: 'Tốt', cls: 'badge-info' }
    : s >= 70 ? { lbl: 'Khá', cls: 'badge-warning' } : { lbl: 'Cần cải thiện', cls: 'badge-danger' });

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

export const clampScore = (v) => Math.max(0, Math.min(100, parseFloat(v) || 0));
export const calcTotal = (scores) => CRITERIA.reduce((t, c) => t + clampScore(scores[c.key]) * c.weight, 0);
export const initialScores = (existing) => Object.fromEntries(CRITERIA.map((c) => [c.key, existing ? existing[c.key] : 0]));

// Mọi nhân viên trong phạm vi xem; người chưa được chấm KPI xếp cuối
export function buildRanking(emps, records) {
  const byEmp = {};
  records.forEach((k) => { byEmp[k.employeeId] = k; });
  return emps.map((e) => ({ e, rec: byEmp[e.id] || null }))
    .sort((a, b) => (b.rec ? b.rec.total : -1) - (a.rec ? a.rec.total : -1))
    .map((r, i) => ({ ...r, pos: i + 1 })); // pos = thứ hạng trong toàn bộ bảng (giữ nguyên khi lọc)
}

// KPI trung bình theo phòng ban (chỉ tính người đã có điểm)
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

export function buildKpiPayload(scores, employeeId, period, evaluatedBy) {
  const payload = { employeeId, period, evaluatedBy };
  CRITERIA.forEach((c) => { payload[c.key] = clampScore(scores[c.key]); });
  return payload;
}

export function kpiCsvRows(ranked) {
  const rows = [['Hạng', 'Mã NV', 'Họ tên', 'Phòng ban', 'Điểm KPI', 'Xếp loại', 'Người đánh giá']];
  ranked.forEach((r, i) => rows.push([i + 1, r.e.employeeCode, r.e.name, r.e.department ? r.e.department.name : '',
    r.rec ? r.rec.total : '', r.rec ? rankOf(r.rec.total).lbl : 'Chưa chấm', (r.rec && r.rec.evaluatedBy) || '']));
  return rows;
}

// ---- Lọc & tổng hợp cho giao diện ----
export const rankKeyOf = (rec) => (!rec ? 'none' : rec.total >= 90 ? 'excellent' : rec.total >= 80 ? 'good' : rec.total >= 70 ? 'fair' : 'poor');

export const RANK_FILTERS = [
  { key: '', label: 'Tất cả' }, { key: 'excellent', label: 'Xuất sắc' }, { key: 'good', label: 'Tốt' },
  { key: 'fair', label: 'Khá' }, { key: 'poor', label: 'Cần cải thiện' }, { key: 'none', label: 'Chưa chấm' },
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

// q = tên/mã nhân viên, dept = id phòng ban, rank = một khóa của RANK_FILTERS
export function filterRanking(ranked, { q = '', dept = '', rank = '' } = {}) {
  const needle = q.toLowerCase().trim();
  return ranked.filter((r) => {
    if (dept && String(r.e.department ? r.e.department.id : '') !== String(dept)) return false;
    if (rank && rankKeyOf(r.rec) !== rank) return false;
    if (needle && !(r.e.name.toLowerCase().includes(needle) || (r.e.employeeCode || '').toLowerCase().includes(needle))) return false;
    return true;
  });
}
