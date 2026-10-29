'use client';
import { graceOf, otOf } from './shiftUtils';

export default function ShiftTable({ shifts, canEdit, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>Mã ca</th><th>Tên ca</th><th>Giờ vào</th><th>Giờ ra</th><th>Cho phép muộn</th><th>Hệ số OT</th><th>Số NV</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.code}</strong></td><td>{s.name}</td>
              <td>{s.startTime}</td><td>{s.endTime}</td>
              <td>{graceOf(s)} phút</td><td>×{otOf(s)}</td><td>{s.employeeCount || 0}</td>
              <td>{canEdit ? (
                <>
                  <button type="button" className="icon-btn" onClick={() => onEdit(s)}>✏️</button>
                  <button type="button" className="icon-btn" onClick={() => onDelete(s)}>🗑️</button>
                </>
              ) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
