'use client';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { useRefs } from '@/context/RefsContext';
import { graceOf } from '../shifts/shiftUtils';
import { metaOf, statusOf } from './attendanceUtils';

export default function AttendanceTable({ rows, onDetail }) {
  const { empById, shiftById } = useRefs();
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>Nhân viên</th><th>Phòng ban</th><th>Ca làm</th><th>Giờ vào</th><th>Giờ ra</th><th>Tình trạng</th><th>Ghi chú</th><th>Chi tiết</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Chưa có bản ghi chấm công trong ngày này</td></tr>
          )}
          {rows.map((r) => {
            const st = statusOf(r.status);
            const m = metaOf(r, shiftById(r.shiftId) || r.shift);
            const dept = (empById(r.employeeId) || r.employee || {}).department || (r.employee || {}).department;
            return (
              <tr key={r.id}>
                <td><EmpCell employee={r.employee} /></td>
                <td><DeptTag dept={dept} /></td>
                <td>{m.shift ? (
                  <>
                    <strong>{m.shift.name}</strong>
                    <div className="att-sub">{m.shift.startTime}–{m.shift.endTime} · cho phép muộn {graceOf(m.shift)}p</div>
                  </>
                ) : <span className="badge badge-gray">Chưa phân ca</span>}</td>
                <td>{r.checkIn || '—'}</td><td>{r.checkOut || '—'}</td>
                <td><span className={`badge ${st.cls}`}>{st.lbl}</span><div className="att-reason">{m.reason}</div></td>
                <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.note || ''}</td>
                <td><button type="button" className="btn btn-outline btn-xs" onClick={() => onDetail(r)}>Chi tiết</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
