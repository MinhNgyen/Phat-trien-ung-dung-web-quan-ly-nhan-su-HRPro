'use client';
import { dateOnly, fmt } from '@/lib/format';
import EmpAvatar from '@/components/ui/EmpAvatar';
import DeptTag from '@/components/ui/DeptTag';
import ShiftChips from '@/components/ui/ShiftChips';
import { KpiBadge, StatusBadge } from '@/components/ui/Badges';

export default function EmployeeTable({ employees, kpiCur, canEdit, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>Mã NV</th><th>Họ và tên</th><th>Chức vụ</th><th>Phòng ban</th><th>Ca làm</th><th>Ngày vào</th><th>Lương CB (VNĐ)</th><th>KPI</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Không có nhân viên phù hợp</td></tr>
          )}
          {employees.map((e) => (
            <tr key={e.id}>
              <td><strong>{e.employeeCode}</strong></td>
              <td>
                <div className="emp-cell">
                  <EmpAvatar employee={e} />
                  <div><div className="emp-name">{e.name}</div><div className="emp-sub">{e.email || ''}</div></div>
                </div>
              </td>
              <td>{e.position || ''}</td>
              <td><DeptTag dept={e.department} /></td>
              <td><div className="shift-chip-list"><ShiftChips employee={e} /></div></td>
              <td>{dateOnly(e.joinedAt)}</td>
              <td>{fmt(e.salary)}</td>
              <td><KpiBadge value={kpiCur[e.id]} /></td>
              <td><StatusBadge status={e.status} /></td>
              <td>
                {canEdit ? (
                  <>
                    <button type="button" className="icon-btn" title="Sửa" onClick={() => onEdit(e)}>✏️</button>
                    <button type="button" className="icon-btn" title="Xóa" onClick={() => onDelete(e)}>🗑️</button>
                  </>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
