// Logic THUẦN của tính năng Chấm công. Trạng thái thật do backend tính; ở đây chỉ để hiển thị & xem trước.
import { graceOf } from '../shifts/shiftUtils';

export const ATT_STATUS = {
  PRESENT: { lbl: 'Đúng giờ', cls: 'badge-success' },
  LATE: { lbl: 'Muộn / về sớm', cls: 'badge-warning' },
  ABSENT: { lbl: 'Vắng', cls: 'badge-danger' },
  LEAVE: { lbl: 'Nghỉ phép', cls: 'badge-info' },
};
export const statusOf = (status) => ATT_STATUS[status] || ATT_STATUS.ABSENT;

export const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Số phút về sớm so với giờ kết thúc ca (ca đêm qua ngày được xử lý riêng)
export function earlyMinutes(shift, outT) {
  const o = toMin(outT); const s = shift && toMin(shift.startTime); const e = shift && toMin(shift.endTime);
  if (o == null || s == null || e == null) return 0;
  let outAdj = o; let endAdj = e;
  if (e <= s) { endAdj = e + 1440; if (o < s) outAdj = o + 1440; }
  return Math.max(0, endAdj - outAdj);
}

const describe = (late, early) => {
  const parts = [];
  if (late > 0) parts.push(`Đi muộn ${late} phút`);
  if (early > 0) parts.push(`Về sớm ${early} phút`);
  return parts.join(' · ') || 'Đúng ca';
};

// Xem trước kết quả từ form (cùng quy tắc với backend, backend tính lại khi lưu)
export function evaluate(shift, type, inT, outT) {
  if (type === 'leave') return { status: 'LEAVE', late: 0, early: 0, reason: 'Nghỉ phép' };
  if (type === 'absent') return { status: 'ABSENT', late: 0, early: 0, reason: 'Vắng không phép' };
  if (!shift) return { status: 'ABSENT', late: 0, early: 0, reason: 'Chưa phân ca' };
  if (!inT) return { status: 'ABSENT', late: 0, early: 0, reason: 'Chưa có giờ vào' };
  const late = Math.max(0, toMin(inT) - (toMin(shift.startTime) + graceOf(shift)));
  const early = outT ? earlyMinutes(shift, outT) : 0;
  return { status: late > 0 || early > 0 ? 'LATE' : 'PRESENT', late, early, reason: describe(late, early) };
}

// Diễn giải 1 bản ghi đã lưu; shift = ca đã tra cứu (đầy đủ giờ giấc)
export function metaOf(record, shift) {
  if (record.status === 'LEAVE') return { shift, late: 0, early: 0, reason: 'Nghỉ phép' };
  if (record.status === 'ABSENT') return { shift, late: 0, early: 0, reason: 'Vắng không phép' };
  const late = record.lateMinutes || 0;
  const early = earlyMinutes(shift, record.checkOut);
  return { shift, late, early, reason: describe(late, early) };
}

export function countByStatus(rows) {
  const c = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
  rows.forEach((r) => { if (c[r.status] != null) c[r.status]++; });
  return c;
}

// Ca gợi ý cho 1 nhân viên: ca của họ, nếu chưa có thì tất cả ca
export function shiftOptionsFor(emp, allShifts) {
  const own = ((emp && emp.shifts) || []).map((s) => allShifts.find((x) => x.id === s.id) || s);
  return own.length ? own : allShifts;
}

export function checkinDefaults(emp, allShifts) {
  const s = shiftOptionsFor(emp, allShifts)[0];
  return { shiftId: s ? s.id : '', checkIn: s ? s.startTime : '08:00', checkOut: s ? s.endTime : '17:00' };
}

// Form chấm công thủ công -> payload gửi API (hoặc { error })
export function buildCheckinPayload(f) {
  const employeeId = Number(f.employeeId);
  if (!employeeId || !f.date) return { error: 'Chọn nhân viên và ngày' };
  const payload = { employeeId, shiftId: Number(f.shiftId) || null, date: f.date, type: 'NORMAL', note: (f.note || '').trim() || null };
  if (f.type === 'work') {
    if (!f.checkIn) return { error: 'Vui lòng nhập giờ vào' };
    payload.checkIn = f.checkIn; payload.checkOut = f.checkOut || null;
  } else {
    payload.status = f.type === 'leave' ? 'LEAVE' : 'ABSENT';
    payload.checkIn = null; payload.checkOut = null;
  }
  return { payload };
}

export function attendanceCsvRows(date, rows, { shiftOf, deptOf }) {
  const out = [['Ngày', 'Mã NV', 'Họ tên', 'Phòng ban', 'Ca làm', 'Giờ vào', 'Giờ ra', 'Giờ làm', 'Tình trạng', 'Chi tiết muộn/về sớm', 'Ghi chú']];
  rows.forEach((r) => {
    const m = metaOf(r, shiftOf(r));
    const dept = deptOf(r);
    out.push([date, r.employee.employeeCode, r.employee.name, dept ? dept.name : '', m.shift ? m.shift.name : '',
      r.checkIn || '', r.checkOut || '', r.workHours || 0, statusOf(r.status).lbl, m.reason, r.note || '']);
  });
  return out;
}

/**
 * Trạng thái chấm công HÔM NAY của chính mình, từ các bản ghi của ngày đó:
 * 'in' = đã vào chưa ra · 'done' = đã vào và ra · 'off' = nghỉ phép/vắng · 'none' = chưa chấm.
 */
export function selfCheckinState(records) {
  const open = records.find((r) => r.checkIn && !r.checkOut);
  if (open) return { state: 'in', record: open };
  const done = records.filter((r) => r.checkIn && r.checkOut);
  if (done.length) return { state: 'done', record: done[done.length - 1] };
  const off = records.find((r) => r.status === 'LEAVE' || r.status === 'ABSENT');
  if (off) return { state: 'off', record: off };
  return { state: 'none', record: null };
}
