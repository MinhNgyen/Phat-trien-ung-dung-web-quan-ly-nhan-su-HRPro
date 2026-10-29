'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useNow } from '@/hooks/useNow';
import { statusOf } from '../attendance/attendanceUtils';
import { useSelfAttendance } from '../attendance/useSelfAttendance';
import { greetingOf } from './dashboardUtils';

/** Thẻ chấm công của chính mình: đồng hồ trực tiếp, nút vào/ra, trạng thái hôm nay. onChanged() chạy sau khi chấm công thành công. */
export default function CheckinCard({ onChanged }) {
  const { user } = useAuth();
  const { empById } = useRefs();
  const now = useNow();
  const { employeeId, current, checkIn, checkOut, busy } = useSelfAttendance();
  const [shiftId, setShiftId] = useState('');

  const emp = employeeId ? empById(employeeId) : null;
  const shifts = (emp && emp.shifts) || [];
  const chosen = shiftId || (shifts[0] ? String(shifts[0].id) : '');
  const state = current ? current.state : null;
  const r = current ? current.record : null;

  const time = now.toLocaleTimeString('vi-VN', { hour12: false });
  const dateLabel = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  async function doIn() { if (await checkIn(chosen)) onChanged(); }
  async function doOut() { if (await checkOut()) onChanged(); }

  if (!employeeId) {
    return (
      <div className="checkin-card muted">
        <div><div className="clock" style={{ fontSize: 26 }}>{time}</div><div className="date">{dateLabel}</div></div>
        <div className="status"><strong>Chưa thể chấm công</strong><span>Tài khoản này chưa liên kết với hồ sơ nhân viên nào.</span></div>
      </div>
    );
  }

  let title = 'Đang kiểm tra...'; let desc = '';
  if (state === 'none') { title = 'Bạn chưa chấm công hôm nay'; desc = 'Bấm "Chấm công vào" khi bắt đầu ca làm.'; }
  if (state === 'in') {
    title = `Đã chấm công vào lúc ${r.checkIn}`;
    desc = `${statusOf(r.status).lbl}${r.lateMinutes > 0 ? ` · đi muộn ${r.lateMinutes} phút` : ''} · nhớ chấm công ra khi hết ca`;
  }
  if (state === 'done') { title = `Hoàn thành: ${r.checkIn} → ${r.checkOut}`; desc = `${r.workHours || 0} giờ làm · ${statusOf(r.status).lbl}`; }
  if (state === 'off') { title = statusOf(r.status).lbl; desc = 'Hôm nay bạn không cần chấm công.'; }

  return (
    <div className="checkin-card">
      <div>
        <div className="greet">{greetingOf(now.getHours())}, {user.name}</div>
        <div className="clock">{time}</div>
        <div className="date">{dateLabel}</div>
      </div>
      <div className="status"><strong>{title}</strong><span>{desc}</span></div>
      <div className="actions">
        {shifts.length > 1 && (state === 'none' || state === 'done') && (
          <select value={chosen} onChange={(e) => setShiftId(e.target.value)}>
            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
          </select>
        )}
        <button type="button" className="btn btn-in" onClick={doIn} disabled={busy || !current || state === 'in' || state === 'off'}>✅ Chấm công vào</button>
        <button type="button" className="btn btn-out" onClick={doOut} disabled={busy || state !== 'in'}>↩ Chấm công ra</button>
      </div>
    </div>
  );
}
