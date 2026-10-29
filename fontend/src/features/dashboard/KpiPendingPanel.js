'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { useRefs } from '@/context/RefsContext';
import { curMonth } from '@/lib/format';
import KpiEvalModal from '../kpi/KpiEvalModal';
import { pendingKpi } from './dashboardUtils';

const LIMIT = 5;

/** HR/Admin: tiến độ chấm KPI kỳ này, chấm nhanh cho người còn thiếu ngay tại Dashboard. */
export default function KpiPendingPanel({ onChanged }) {
  const { emps, kpiCur } = useRefs();
  const [evaluating, setEvaluating] = useState(null);
  const period = curMonth();
  const pending = useMemo(() => pendingKpi(emps, kpiCur), [emps, kpiCur]);
  const activeCount = emps.filter((e) => e.status === 'ACTIVE').length;
  const done = activeCount - pending.length;
  const pct = activeCount ? Math.round((done / activeCount) * 100) : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">KPI kỳ {period} — còn thiếu</div>
        <Link href="/performance" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }}>Mở trang KPI</Link>
      </div>
      <div className="progress-line">
        <div className="top"><span>Đã chấm {done}/{activeCount} nhân viên</span><strong>{pct}%</strong></div>
        <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="panel-list">
        {pending.length === 0 && <div className="panel-empty">✅ Đã chấm KPI cho tất cả nhân viên</div>}
        {pending.slice(0, LIMIT).map((e) => (
          <div className="panel-row" key={e.id}>
            <div className="grow"><EmpCell employee={e} sub={e.position || e.employeeCode} /></div>
            <DeptTag dept={e.department} />
            <button type="button" className="btn btn-primary" onClick={() => setEvaluating(e)}>Chấm KPI</button>
          </div>
        ))}
      </div>
      {pending.length > LIMIT && <div className="panel-foot">+{pending.length - LIMIT} nhân viên nữa — <Link href="/performance">xem tất cả</Link></div>}

      {evaluating && <KpiEvalModal key={evaluating.id} employee={evaluating} period={period} existing={undefined}
        onClose={() => setEvaluating(null)} onSaved={onChanged} />}
    </div>
  );
}
