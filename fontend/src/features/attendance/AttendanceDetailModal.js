'use client';
import Modal from '@/components/ui/Modal';
import EmpAvatar from '@/components/ui/EmpAvatar';
import { useRefs } from '@/context/RefsContext';
import { graceOf } from '../shifts/shiftUtils';
import { metaOf, statusOf } from './attendanceUtils';

export default function AttendanceDetailModal({ record: r, onClose }) {
  const { empById, shiftById } = useRefs();
  const st = statusOf(r.status);
  const m = metaOf(r, shiftById(r.shiftId) || r.shift);
  const sh = m.shift;
  const emp = empById(r.employeeId) || r.employee;
  const cell = (label, value) => <div><span>{label}</span><strong>{value}</strong></div>;

  return (
    <Modal title="🔎 Chi tiết chấm công" onClose={onClose}>
      <div className="detail-hero">
        <EmpAvatar employee={r.employee} />
        <div>
          <div className="emp-name">{r.employee.name}</div>
          <div className="emp-sub">{r.employee.employeeCode} · {(emp.department || {}).name || ''}</div>
        </div>
        <span className={`badge ${st.cls}`} style={{ marginLeft: 'auto' }}>{st.lbl}</span>
      </div>
      <div className="detail-grid">
        {cell('Ngày', r.date)}
        {cell('Ca áp dụng', sh ? sh.name : 'Chưa phân ca')}
        {cell('Giờ ca', sh ? `${sh.startTime}–${sh.endTime}` : '—')}
        {cell('Cho phép muộn', sh ? `${graceOf(sh)} phút` : '—')}
        {cell('Giờ vào', r.checkIn || '—')}
        {cell('Giờ ra', r.checkOut || '—')}
        {cell('Đi muộn', `${m.late} phút`)}
        {cell('Về sớm', `${m.early} phút`)}
        {cell('Số giờ làm', `${r.workHours || 0} giờ`)}
      </div>
      <div className="ci-preview">
        <strong>Kết luận:</strong> {m.reason}
        {r.note && <><br /><strong>Ghi chú:</strong> {r.note}</>}
      </div>
    </Modal>
  );
}
