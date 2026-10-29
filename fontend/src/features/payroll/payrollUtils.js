// Logic THUẦN của tính năng Tính lương. Số liệu do BACKEND tính (POST /payroll/calculate); client chỉ hiển thị.

// Các cột của biểu đồ phân phối mức lương thực nhận
export const BUCKETS = [
  { label: '<10tr', min: 0, max: 10e6 }, { label: '10–15tr', min: 10e6, max: 15e6 },
  { label: '15–20tr', min: 15e6, max: 20e6 }, { label: '20–25tr', min: 20e6, max: 25e6 },
  { label: '≥25tr', min: 25e6, max: Infinity },
];

export const inBucket = (net, b) => net >= b.min && net < b.max;
export const bucketCounts = (items) => BUCKETS.map((b) => items.filter((p) => inBucket(p.netSalary, b)).length);

export function summarize(items) {
  const nets = items.map((p) => p.netSalary);
  const total = nets.reduce((a, b) => a + b, 0);
  return {
    total,
    avg: items.length ? total / items.length : 0,
    max: nets.length ? Math.max(...nets) : 0,
    min: nets.length ? Math.min(...nets) : 0,
  };
}

// dept = id phòng ban (chuỗi), bucket = chỉ số cột đang chọn hoặc null, q = từ khóa tên/mã nhân viên
export function filterPayroll(items, { dept = '', bucket = null, q = '' } = {}) {
  let out = items;
  const needle = q.toLowerCase().trim();
  if (dept) out = out.filter((p) => p.employee.department && String(p.employee.department.id) === String(dept));
  if (bucket != null) out = out.filter((p) => inBucket(p.netSalary, BUCKETS[bucket]));
  if (needle) out = out.filter((p) => p.employee.name.toLowerCase().includes(needle) || (p.employee.employeeCode || '').toLowerCase().includes(needle));
  return out;
}

// sort = { key: 'name' | 'baseSalary' | 'netSalary', dir: 'asc' | 'desc' } hoặc null (giữ thứ tự backend)
export function sortPayroll(items, sort) {
  if (!sort) return items;
  const m = sort.dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => (sort.key === 'name'
    ? m * a.employee.name.localeCompare(b.employee.name, 'vi')
    : m * ((a[sort.key] || 0) - (b[sort.key] || 0))));
}

// Bấm tiêu đề cột: lần 1 -> lần 2 (đảo chiều) -> bỏ sắp xếp. Cột tên bắt đầu từ A→Z, cột số bắt đầu từ lớn→nhỏ
export function nextSort(current, key) {
  const first = key === 'name' ? 'asc' : 'desc';
  if (!current || current.key !== key) return { key, dir: first };
  return current.dir === first ? { key, dir: first === 'asc' ? 'desc' : 'asc' } : null;
}

// Tổng các khoản của cả bảng lương
export function totalsOf(items) {
  const sum = (k) => items.reduce((a, p) => a + (p[k] || 0), 0);
  return { allowance: sum('allowance'), overtime: sum('overtime'), deduction: sum('deduction'), tax: sum('tax') };
}

export const incomeOf = (p) => p.baseSalary + p.allowance + p.overtime;

export function emptyMessage(hasAnyItems, canCalculate) {
  if (hasAnyItems) return 'Không có dữ liệu phù hợp bộ lọc';
  return 'Chưa tính lương cho kỳ này' + (canCalculate ? ' — bấm "Tính lương kỳ này" để tạo bảng lương' : '');
}

export function payrollCsvRows(items) {
  const rows = [['Mã NV', 'Họ tên', 'Phòng ban', 'Lương theo công', 'Công TT', 'Công chuẩn', 'Phụ cấp', 'OT', 'Khấu trừ', 'Lương trước thuế', 'Thuế TNCN', 'Thực nhận']];
  items.forEach((p) => rows.push([p.employee.employeeCode, p.employee.name, (p.employee.department || {}).name || '', p.baseSalary,
    p.workDays, p.standardDays, p.allowance, p.overtime, p.deduction, p.grossSalary, p.tax, p.netSalary]));
  return rows;
}

// Tóm tắt kỳ lương cho Dashboard. state: 'none' (chưa tính) | 'draft' (đã tính, chưa chốt) | 'locked' (đã chốt)
export function payrollSnapshot(data) {
  const items = data.items || [];
  const totalNet = items.reduce((a, p) => a + p.netSalary, 0);
  return {
    state: data.isLocked ? 'locked' : items.length ? 'draft' : 'none',
    count: items.length,
    totalNet,
    avgNet: items.length ? totalNet / items.length : 0,
    top: [...items].sort((a, b) => b.netSalary - a.netSalary).slice(0, 5),
  };
}

// Cộng/trừ tháng cho chuỗi 'YYYY-MM' (qua năm đúng)
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}
