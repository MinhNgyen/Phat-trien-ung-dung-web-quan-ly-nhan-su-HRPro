'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { kpiApi } from '@/api/kpi';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { downloadCSV } from '@/lib/csv';
import { curMonth } from '@/lib/format';
import KpiDeptBars from './KpiDeptBars';
import KpiEvalModal from './KpiEvalModal';
import KpiFilters from './KpiFilters';
import KpiSummary from './KpiSummary';
import KpiTable from './KpiTable';
import KpiTop3 from './KpiTop3';
import { buildRanking, deptAverages, filterRanking, kpiCsvRows, kpiSummary, rankCounts, recentPeriods, topThree } from './kpiUtils';

/** Nạp KPI THEO KỲ (YYYY-MM). */
export default function KpiPage() {
  const { user, can } = useAuth();
  const { emps, depts, deptColor } = useRefs();
  const { refresh: refreshNotifications } = useNotifications();
  const { run } = useRun();
  const [period, setPeriod] = useState(curMonth());
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ q: '', dept: '', rank: '' });
  const [evaluating, setEvaluating] = useState(null); // nhân viên đang được chấm
  const seq = useRef(0);
  const periods = useMemo(() => recentPeriods(), []);
  const canEval = can('admin,hr,manager');

  const load = useCallback(async () => {
    const mine = ++seq.current;
    await run(async () => {
      const data = user.role === 'employee'
        ? (await kpiApi.byEmployee(user.employeeId)).filter((k) => k.period === period)
        : await kpiApi.list({ period });
      if (mine !== seq.current) return;
      setRecords(data);
    }, 'Không tải được dữ liệu KPI.');
  }, [period, user, run]);

  useEffect(() => { load(); }, [load]);

  const ranked = useMemo(() => buildRanking(emps, records), [emps, records]);
  const summary = useMemo(() => kpiSummary(ranked), [ranked]);
  const counts = useMemo(() => rankCounts(ranked), [ranked]);
  const deptBars = useMemo(() => deptAverages(ranked, deptColor), [ranked, deptColor]);
  const top = useMemo(() => topThree(ranked), [ranked]);
  const shown = useMemo(() => filterRanking(ranked, filters), [ranked, filters]);

  return (
    <div className="page active modern">
      <PageHeader title="Hiệu suất & KPI" subtitle="KPI tổng hợp từ nhiều tiêu chí có trọng số, do quản lý/HR chấm theo kỳ">
        <select className="form-control" style={{ width: 150 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          {periods.map((p) => <option key={p} value={p}>Kỳ {p}</option>)}
        </select>
        <button type="button" className="btn btn-outline" onClick={() => downloadCSV(`bao_cao_kpi_${period}.csv`, kpiCsvRows(ranked))}>📤 Xuất CSV</button>
      </PageHeader>

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
          <div className="card-title">Bảng đánh giá nhân viên</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Doanh số 25% · chuyên cần 20% · task 25% · deadline 15% · chất lượng 15%</span>
        </div>
        <KpiFilters filters={filters} onChange={setFilters} depts={depts} counts={counts} shown={`${shown.length}/${ranked.length}`} />
        <KpiTable ranked={shown} canEval={canEval} onEval={setEvaluating} />
      </div>

      {evaluating && canEval && (
        <KpiEvalModal
          key={`${evaluating.id}-${period}`}
          employee={evaluating}
          period={period}
          existing={records.find((k) => k.employeeId === evaluating.id)}
          onClose={() => setEvaluating(null)}
          onSaved={() => { load(); refreshNotifications(); }}
        />
      )}
    </div>
  );
}
