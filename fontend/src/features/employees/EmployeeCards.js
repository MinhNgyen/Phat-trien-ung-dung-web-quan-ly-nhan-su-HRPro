'use client';
import { fmt } from '@/lib/format';
import EmpAvatar from '@/components/ui/EmpAvatar';
import DeptTag from '@/components/ui/DeptTag';
import ShiftChips from '@/components/ui/ShiftChips';
import { KpiBadge, StatusBadge } from '@/components/ui/Badges';

export default function EmployeeCards({ employees, kpiCur }) {
  return (
    <div className="emp-cards-grid">
      {employees.map((e) => (
        <div className="emp-card" key={e.id}>
          <div className="emp-card-top">
            <EmpAvatar employee={e} />
            <div><div className="emp-name">{e.name}</div><div className="emp-sub">{e.position || ''}</div></div>
          </div>
          <div className="emp-card-body">
            <div className="ec-row"><span>Mã NV</span><strong>{e.employeeCode}</strong></div>
            <div className="ec-row"><span>Phòng ban</span><DeptTag dept={e.department} /></div>
            <div className="ec-row"><span>Ca làm</span><div className="shift-chip-list"><ShiftChips employee={e} /></div></div>
            <div className="ec-row"><span>Lương CB</span><strong>{fmt(e.salary)}</strong></div>
            <div className="ec-row"><span>KPI</span><KpiBadge value={kpiCur[e.id]} /></div>
            <div className="ec-row"><span>Trạng thái</span><StatusBadge status={e.status} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
