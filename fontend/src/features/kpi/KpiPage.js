'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { kpiApi } from '@/api/kpi';
import { tasksApi } from '@/api/tasks';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { downloadCSV } from '@/lib/csv';
import { curMonth } from '@/lib/format';
import TaskFormModal from '../tasks/TaskFormModal';
import TaskReviewModal from '../tasks/TaskReviewModal';
import TasksPanel from '../tasks/TasksPanel';
import KpiDeptBars from './KpiDeptBars';
import KpiDetailModal from './KpiDetailModal';
import KpiFilters from './KpiFilters';
import KpiSummary from './KpiSummary';
import KpiTable from './KpiTable';
import KpiTop3 from './KpiTop3';
import { buildRanking, deptAverages, filterRanking, kpiCsvRows, kpiSummary, rankCounts, recentPeriods, topThree } from './kpiUtils';

export default function KpiPage() {
  const { user, can } = useAuth();
  const { emps, depts, deptColor, reload } = useRefs();
  const { refresh: refreshNotifications } = useNotifications();
  const { run, busy } = useRun();
  const [period, setPeriod] = useState(curMonth());
  const [tab, setTab] = useState('tasks');
  const [records, setRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ q: '', dept: '', rank: '' });
  const [assigning, setAssigning] = useState(undefined); // undefined đóng, null thêm, object sửa / {employeeId}
  const [reviewing, setReviewing] = useState(null);
  const [detailEmp, setDetailEmp] = useState(null);
  const seq = useRef(0);
  const periods = useMemo(() => recentPeriods(), []);
  const canManage = can('admin,hr,manager');
  const isEmployee = user.role === 'employee';
  const ownEmployeeId = isEmployee ? user.employeeId : null;

  const load = useCallback(async () => {
    const mine = ++seq.current;
    await run(async () => {
      const [kpiData, taskData] = await Promise.all([
        isEmployee && user.employeeId
          ? (await kpiApi.byEmployee(user.employeeId)).filter((k) => k.period === period)
          : kpiApi.list({ period }),
        isEmployee && user.employeeId
          ? tasksApi.byEmployee(user.employeeId, { period })
          : tasksApi.list({ period }),
      ]);
      if (mine !== seq.current) return;
      setRecords(kpiData);
      setTasks(taskData);
    }, 'Không tải được dữ liệu KPI.');
  }, [period, user, isEmployee, run]);

  useEffect(() => { load(); }, [load]);

  function refreshed() {
    load();
    reload();
    refreshNotifications();
  }

  const ranked = useMemo(() => buildRanking(emps, records), [emps, records]);
  const summary = useMemo(() => kpiSummary(ranked), [ranked]);
  const counts = useMemo(() => rankCounts(ranked), [ranked]);
  const deptBars = useMemo(() => deptAverages(ranked, deptColor), [ranked, deptColor]);
  const top = useMemo(() => topThree(ranked), [ranked]);
  const shown = useMemo(() => filterRanking(ranked, filters), [ranked, filters]);
  const reviewCount = tasks.filter((t) => t.status === 'REVIEW').length;
  const detailTasks = detailEmp ? tasks.filter((t) => t.employeeId === detailEmp.id) : [];

  async function recalc() {
    const ok = await run(async () => { await kpiApi.recalculate({ period }); return true; }, 'Không tính lại được KPI.');
    if (ok) refreshed();
  }

  const assignTask = assigning === null || (assigning && assigning.id) || (assigning && assigning.employeeId)
    ? assigning : null;
  const assignOpen = assigning !== undefined;

  return (
    <div className="page active modern">
      <PageHeader title="Hiệu suất & KPI" subtitle="Giao việc trên bảng Kanban. KPI tự tính: 40% hoàn thành · 30% đúng hạn · 30% chất lượng">
        <select className="form-control" style={{ width: 150 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => <option key={p} value={p}>Kỳ {p}</option>)}
        </select>
        <button type="button" className="btn btn-outline" onClick={() => downloadCSV(`bao_cao_kpi_${period}.csv`, kpiCsvRows(ranked))}>📤 Xuất CSV</button>
        <Can roles="admin,hr,manager">
          <button type="button" className="btn btn-outline" onClick={recalc} disabled={busy}>↻ Tính lại KPI</button>
          <button type="button" className="btn btn-primary" onClick={() => setAssigning(null)}>+ Giao việc</button>
        </Can>
      </PageHeader>

      <div className="tabs">
        <div className={'tab' + (tab === 'tasks' ? ' active' : '')} onClick={() => setTab('tasks')}>
          📋 Đầu việc {reviewCount > 0 && canManage ? <span className="badge badge-warning" style={{ marginLeft: 6 }}>{reviewCount} chờ duyệt</span> : null}
        </div>
        <div className={'tab' + (tab === 'kpi' ? ' active' : '')} onClick={() => setTab('kpi')}>🎯 Kết quả KPI</div>
      </div>

      {tab === 'tasks' && (
        <TasksPanel
          tasks={tasks} employees={emps} canManage={canManage} ownEmployeeId={ownEmployeeId}
          onReview={setReviewing} onEdit={setAssigning} onChanged={refreshed}
        />
      )}

      {tab === 'kpi' && (
        <>
          <KpiSummary summary={summary} />
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">KPI trung bình theo phòng ban</div></div>
              <div className="card-body"><KpiDeptBars items={deptBars} /></div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Top 3 nhân viên xuất sắc</div></div>
              <div className="card-body"><KpiTop3 top={top} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Bảng xếp hạng theo đầu việc</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hoàn thành 40% · đúng hạn 30% · chất lượng 30%</span>
            </div>
            <KpiFilters filters={filters} onChange={setFilters} depts={depts} counts={counts} shown={`${shown.length}/${ranked.length}`} />
            <KpiTable ranked={shown} onView={setDetailEmp} />
          </div>
        </>
      )}

      {assignOpen && canManage && (
        <TaskFormModal
          key={assignTask && assignTask.id ? assignTask.id : `new-${(assignTask && assignTask.employeeId) || 'x'}`}
          task={assignTask && assignTask.id ? assignTask : null}
          employees={emps}
          defaultEmployeeId={assignTask && !assignTask.id ? assignTask.employeeId : undefined}
          onClose={() => setAssigning(undefined)}
          onSaved={refreshed}
        />
      )}
      {reviewing && canManage && (
        <TaskReviewModal task={reviewing} onClose={() => setReviewing(null)} onSaved={refreshed} />
      )}
      {detailEmp && (
        <KpiDetailModal
          employee={detailEmp} period={period} tasks={detailTasks} canManage={canManage}
          onClose={() => setDetailEmp(null)}
          onReview={(t) => { setReviewing(t); }}
          onAssign={() => { setAssigning({ employeeId: detailEmp.id }); setDetailEmp(null); }}
        />
      )}
    </div>
  );
}
