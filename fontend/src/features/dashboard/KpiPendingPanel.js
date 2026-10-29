'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import EmpCell from '@/components/ui/EmpCell';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { curMonth } from '@/lib/format';
import TaskReviewModal from '../tasks/TaskReviewModal';
import { pendingKpi } from './dashboardUtils';

const LIMIT = 5;

/** HR/Admin/Manager: việc chờ duyệt + nhân viên kỳ này chưa có KPI. */
export default function KpiPendingPanel({ onChanged }) {
  const { emps, kpiCur } = useRefs();
  const { run } = useRun();
  const [reviews, setReviews] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const period = curMonth();
  const pending = useMemo(() => pendingKpi(emps, kpiCur), [emps, kpiCur]);
  const activeCount = emps.filter((e) => e.status === 'ACTIVE').length;
  const done = activeCount - pending.length;
  const pct = activeCount ? Math.round((done / activeCount) * 100) : 0;

  const loadReviews = useCallback(async () => {
    await run(async () => {
      setReviews(await tasksApi.list({ period, status: 'REVIEW' }));
    }, 'Không tải được việc chờ duyệt.');
  }, [period, run]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  function saved() {
    loadReviews();
    if (onChanged) onChanged();
  }

  const list = reviews.slice(0, LIMIT);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">KPI kỳ {period} — việc chờ duyệt</div>
        <Link href="/performance" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }}>Mở Kanban</Link>
      </div>
      <div className="progress-line">
        <div className="top"><span>Đã có KPI {done}/{activeCount} nhân viên</span><strong>{pct}%</strong></div>
        <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="panel-list">
        {list.length === 0 && (
          <div className="panel-empty">{pending.length === 0 ? '✅ Không còn việc chờ duyệt' : 'Không có việc chờ duyệt — còn nhân viên chưa có đầu việc'}</div>
        )}
        {list.map((t) => (
          <div className="panel-row" key={t.id}>
            <div className="grow">
              {t.employee ? <EmpCell employee={t.employee} sub={t.title} /> : <span>{t.title}</span>}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setReviewing(t)}>Duyệt</button>
          </div>
        ))}
      </div>
      {reviews.length > LIMIT && <div className="panel-foot">+{reviews.length - LIMIT} việc nữa — <Link href="/performance">xem bảng Kanban</Link></div>}

      {reviewing && <TaskReviewModal task={reviewing} onClose={() => setReviewing(null)} onSaved={saved} />}
    </div>
  );
}
