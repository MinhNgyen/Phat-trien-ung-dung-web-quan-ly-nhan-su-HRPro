'use client';
import Link from 'next/link';
import Can from '@/components/Can';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { KpiBadge, StatusBadge } from '@/components/ui/Badges';
import { fmt } from '@/lib/format';

export default function RecentEmployees({ employees, kpiCur, title }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">{title}</div>
        <Can roles="admin,hr,manager">
          <Link href="/employees" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }}>Xem tất cả</Link>
        </Can>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nhân viên</th><th>Phòng ban</th><th className="num">Lương CB</th><th>KPI</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {employees.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Chưa có nhân viên</td></tr>}
            {employees.map((e) => (
              <tr key={e.id}>
                <td><EmpCell employee={e} sub={e.position || ''} /></td>
                <td><DeptTag dept={e.department} /></td>
                <td className="num">{fmt(e.salary)}</td>
                <td><KpiBadge value={kpiCur[e.id]} /></td>
                <td><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
