// Logic THUẦN của tính năng Ca làm việc
// Cột graceMinutes/overtimeRate có thể chưa có nếu DB chưa cập nhật -> dùng giá trị mặc định
export const graceOf = (s) => (s && s.graceMinutes != null ? s.graceMinutes : 10);
export const otOf = (s) => (s && s.overtimeRate != null ? Number(s.overtimeRate) : 1.5);

export const emptyShiftForm = () => ({ code: '', name: '', startTime: '08:00', endTime: '17:00', graceMinutes: '10', overtimeRate: '1.5' });
export const formFromShift = (s) => ({
  code: s.code, name: s.name, startTime: s.startTime, endTime: s.endTime,
  graceMinutes: String(graceOf(s)), overtimeRate: String(otOf(s)),
});

export function validateShift(form, shifts, editId = null) {
  if (!form.code.trim() || !form.name.trim()) return 'Nhập mã và tên ca';
  if (shifts.some((s) => s.code === form.code.trim() && String(s.id) !== String(editId))) return 'Mã ca đã tồn tại';
  return null;
}

export const toShiftPayload = (form) => ({
  code: form.code.trim(), name: form.name.trim(), startTime: form.startTime, endTime: form.endTime,
  graceMinutes: parseInt(form.graceMinutes, 10) || 0,
  overtimeRate: parseFloat(form.overtimeRate) || 1,
});

// Xóa ca -> backend tự gỡ phân ca liên quan, nên cảnh báo nếu đang có người dùng
export const deleteShiftMessage = (s) =>
  (s.employeeCount ? `Ca này đang được ${s.employeeCount} nhân viên sử dụng, xóa sẽ gỡ phân ca của họ. ` : '') + `Xóa ca ${s.name}?`;
