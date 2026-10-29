'use client';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { fmt } from '@/lib/format';

const arrow = (sort, key) => (sort && sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');

export default function SalaryTable({ items, emptyText, onPayslip, sort, onSort }) {
  const Th = ({ k, children, num }) => (
    <th className={`sortable${num ? ' num' : ''}`} onClick={() => onSort(k)} title="Bấm để sắp xếp">{children}{arrow(sort, k)}</th>
  );
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <Th k="name">Nhân viên</Th><th>Công</th><Th k="baseSalary" num>Lương theo công</Th>
            <th className="num">Phụ cấp</th><th className="num">OT</th><th className="num">Khấu trừ</th>
            <th className="num">Trước thuế</th><th className="num">Thuế TNCN</th><Th k="netSalary" num>Thực nhận</Th><th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>{emptyText}</td></tr>}
          {items.map((p) => (
            <tr key={p.id}>
              <td><EmpCell employee={p.employee} sub={<>{p.employee.employeeCode} · <DeptTag dept={p.employee.department} /></>} /></td>
              <td>{p.workDays}/{p.standardDays}</td>
              <td className="num">{fmt(p.baseSalary)}</td>
              <td className="num" style={{ color: 'var(--success)' }}>+{fmt(p.allowance)}</td>
              <td className="num">{p.overtime ? `+${fmt(p.overtime)}` : '—'}</td>
              <td className="num" style={{ color: 'var(--danger)' }}>{p.deduction ? `-${fmt(p.deduction)}` : '—'}</td>
              <td className="num">{fmt(p.grossSalary)}</td>
              <td className="num" style={{ color: 'var(--danger)' }}>{p.tax ? `-${fmt(p.tax)}` : '0'}</td>
              <td className="num"><span className="pill-net">{fmt(p.netSalary)}</span></td>
              <td><button type="button" className="icon-btn" title="Xem phiếu lương" onClick={() => onPayslip(p)}>📄</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
