// Logic THUẦN của tính năng Nhân viên (không đụng React/DOM) -> dễ viết test, dễ sửa.
import { dateOnly, todayStr } from '../../lib/format';

export const STATUS_LABELS = { ACTIVE: 'Đang làm', LEAVE: 'Nghỉ phép', INACTIVE: 'Đã nghỉ việc' };

// Lọc theo ô tìm kiếm (tên / mã / chức vụ), phòng ban, trạng thái
export function filterEmployees(emps, { q = '', dept = '', status = '' } = {}) {
  const needle = q.toLowerCase().trim();
  return emps.filter((e) => {
    if (dept && String(e.department ? e.department.id : '') !== String(dept)) return false;
    if (status && e.status !== status) return false;
    if (needle && !(e.name.toLowerCase().includes(needle)
      || (e.employeeCode || '').toLowerCase().includes(needle)
      || (e.position || '').toLowerCase().includes(needle))) return false;
    return true;
  });
}

// Gợi ý mã kế tiếp: NV + (số lớn nhất hiện có + 1)
export function nextEmployeeCode(emps) {
  const maxN = emps.reduce((m, e) => Math.max(m, parseInt((e.employeeCode || '').replace(/\D/g, ''), 10) || 0), 0);
  return 'NV' + String(maxN + 1).padStart(3, '0');
}

export function emptyForm(emps, shifts) {
  return {
    name: '', code: nextEmployeeCode(emps), email: '', phone: '', deptId: '', position: '',
    joinedAt: todayStr(), salary: '', status: 'ACTIVE', shiftIds: shifts[0] ? [shifts[0].id] : [],
  };
}

export function formFromEmployee(e) {
  return {
    name: e.name, code: e.employeeCode, email: e.email || '', phone: e.phone || '',
    deptId: e.department ? e.department.id : '', position: e.position || '',
    joinedAt: dateOnly(e.joinedAt), salary: e.salary, status: e.status,
    shiftIds: (e.shifts || []).map((s) => s.id),
  };
}

// Trả về thông báo lỗi (string) hoặc null nếu hợp lệ. editId = id đang sửa (để bỏ qua chính nó khi kiểm tra trùng)
export function validateEmployee(form, emps, editId = null) {
  const name = form.name.trim(); const code = form.code.trim(); const email = form.email.trim();
  const salary = parseInt(form.salary, 10) || 0;
  const other = (e) => String(e.id) !== String(editId);
  if (!name) return 'Vui lòng nhập họ tên';
  if (!code) return 'Vui lòng nhập mã nhân viên';
  if (!email) return 'Vui lòng nhập email (bắt buộc, dùng để tránh trùng nhân viên)';
  if (!form.deptId) return 'Vui lòng chọn phòng ban';
  if (!form.shiftIds.length) return 'Vui lòng chọn ít nhất một ca làm việc';
  if (salary < 1000000) return 'Lương cơ bản không hợp lệ (tối thiểu 1.000.000đ)';
  if (emps.some((e) => e.employeeCode === code && other(e))) return `Mã nhân viên "${code}" đã tồn tại!`;
  if (emps.some((e) => e.email === email && other(e))) return 'Email này đã được dùng bởi nhân viên khác';
  return null;
}

export function toPayload(form) {
  return {
    employeeCode: form.code.trim(), name: form.name.trim(), email: form.email.trim(),
    phone: form.phone.trim() || null, position: form.position.trim() || null,
    joinedAt: form.joinedAt || todayStr(), salary: parseInt(form.salary, 10) || 0,
    status: form.status, departmentId: Number(form.deptId),
  };
}

/**
 * Lập kế hoạch đồng bộ ca: so ca hiện có (current = [{shiftId,isPrimary}]) với danh sách ca muốn có.
 * Trả về ca cần gỡ và ca cần gán; nếu chưa có ca chính thì ca mới đầu tiên là ca chính.
 */
export function planShiftSync(current, wantedIds) {
  const want = [...new Set(wantedIds.map(Number))];
  const toRemove = current.filter((r) => !want.includes(r.shiftId)).map((r) => r.shiftId);
  let hasPrimary = current.some((r) => want.includes(r.shiftId) && r.isPrimary);
  const toAdd = [];
  for (const shiftId of want) {
    if (!current.some((r) => r.shiftId === shiftId)) {
      toAdd.push({ shiftId, isPrimary: !hasPrimary });
      hasPrimary = true;
    }
  }
  return { toRemove, toAdd };
}

export function employeesToCsvRows(emps, kpiCur) {
  const rows = [['Mã NV', 'Họ tên', 'Chức vụ', 'Phòng ban', 'Ngày vào', 'Lương CB', 'KPI kỳ này', 'Ca làm', 'Email', 'Điện thoại', 'Trạng thái']];
  emps.forEach((e) => rows.push([
    e.employeeCode, e.name, e.position || '', e.department ? e.department.name : '', dateOnly(e.joinedAt), e.salary,
    kpiCur[e.id] == null ? '' : kpiCur[e.id], (e.shifts || []).map((s) => s.name).join(', '),
    e.email || '', e.phone || '', STATUS_LABELS[e.status] || e.status,
  ]));
  return rows;
}
