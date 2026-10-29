'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import { kpiApi } from '@/api/kpi';
import { reportsApi } from '@/api/reports';
import BarChart from '@/components/ui/BarChart';
import DonutChart from '@/components/ui/DonutChart';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useLateBadge } from '@/context/LateBadgeContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { groupByDept } from '@/lib/deptStats';
import { fmt, todayStr } from '@/lib/format';
import AccountsPanel from './AccountsPanel';
import AttendanceTodayPanel from './AttendanceTodayPanel';
import CheckinCard from './CheckinCard';
import DashboardStats from './DashboardStats';
import DeptDetail from './DeptDetail';
import KpiPendingPanel from './KpiPendingPanel';
import PayrollPanel from './PayrollPanel';
import RecentEmployees from './RecentEmployees';
import { averageOf, deptDetail, filterByDept } from './dashboardUtils';

const HR_ROLES = 'admin,hr,manager';
const FINANCE_ROLES = 'admin,accountant';

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { emps, kpiCur, deptColor } = useRefs();
  const { setLateToday } = useLateBadge();
  const { refresh: refreshNotifications } = useNotifications();
  const { run } = useRun();
  const [dash, setDash] = useState(null);
  const [ownKpi, setOwnKpi] = useState(null);   // nhân viên thường: KPI mới nhất của chính mình
  const [todayRows, setTodayRows] = useState([]); // chấm công hôm nay (HR/Admin)
  const [selected, setSelected] = useState('');   // tên phòng ban đang chọn trên biểu đồ ('' = không chọn)
  const [metric, setMetric] = useState('salary'); // biểu đồ cột: 'salary' | 'count'

  const loadDash = useCallback(async () => {
    await run(async () => {
      const d = await reportsApi.dashboard();
      const mine = user.role === 'employee'
        ? (await kpiApi.byEmployee(user.employeeId)).slice(0, 1).map((k) => k.total) : null;
      const rows = can(HR_ROLES) ? await attendanceApi.byDate(todayStr()).catch(() => []) : [];
      setDash(d);
      setOwnKpi(mine);
      setTodayRows(rows);
      if (can('admin,hr,manager')) setLateToday(d.lateToday);
    }, 'Không tải được dashboard.');
  }, [user, can, run, setLateToday]);

  useEffect(() => { loadDash(); }, [loadDash]);

  // sau mỗi thao tác (chấm công, chấm KPI, tính/chốt lương): làm mới số liệu và chuông thông báo
  const onDataChanged = useCallback(() => { loadDash(); refreshNotifications(); }, [loadDash, refreshNotifications]);

  const groups = useMemo(() => groupByDept(emps, deptColor), [emps, deptColor]);
  const baseSalarySum = useMemo(() => emps.reduce((a, e) => a + e.salary, 0), [emps]);
  const avgKpi = averageOf(ownKpi || Object.values(kpiCur));
  const toggle = (name) => setSelected((cur) => (cur === name ? '' : name));
  const picked = groups.find((g) => g.name === selected);
  const listed = filterByDept(emps, selected).slice(0, selected ? 8 : 6);
  const bySalary = metric === 'salary';

  return (
    <div className="page active modern">
      <PageHeader title="Tổng quan hệ thống" subtitle="Dữ liệu cập nhật trực tiếp từ cơ sở dữ liệu. Bấm vào thẻ, biểu đồ hoặc nút hành động để xử lý ngay." />
      <CheckinCard onChanged={onDataChanged} />
      <DashboardStats dash={dash} baseSalarySum={baseSalarySum} avgKpi={avgKpi} />

      {can(HR_ROLES) && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <AttendanceTodayPanel rows={todayRows} onChanged={onDataChanged} />
          <KpiPendingPanel onChanged={onDataChanged} />
        </div>
      )}
      {can(FINANCE_ROLES) && (
        <div className={can('admin') ? 'grid-2' : undefined} style={{ marginBottom: 20 }}>
          <PayrollPanel onChanged={onDataChanged} />
          {can('admin') && <AccountsPanel />}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">{bySalary ? 'Quỹ lương' : 'Số nhân viên'} theo phòng ban</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className={'chip' + (bySalary ? ' active' : '')} onClick={() => setMetric('salary')}>Quỹ lương</button>
              <button type="button" className={'chip' + (!bySalary ? ' active' : '')} onClick={() => setMetric('count')}>Nhân viên</button>
            </div>
          </div>
          <div className="card-body">
            <BarChart height={160} activeLabel={selected} onBarClick={(i) => toggle(groups[i].name)}
              fmtValue={bySalary ? (v) => `${fmt(v / 1e6)}tr` : undefined}
              data={groups.map((g) => ({ label: g.name, value: bySalary ? g.salarySum : g.count, color: g.color }))} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Nhân sự theo phòng ban</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bấm cung tròn hoặc tên phòng ban</span>
          </div>
          <div className="card-body">
            <DonutChart activeLabel={selected} onSelect={toggle} data={groups.map((g) => ({ label: g.name, value: g.count, color: g.color }))} />
          </div>
        </div>
      </div>

      {picked && <DeptDetail detail={deptDetail(emps, selected, kpiCur)} color={picked.color} onClear={() => setSelected('')} />}
      <RecentEmployees employees={listed} kpiCur={kpiCur} title={selected ? `Nhân viên phòng ${selected}` : 'Danh sách nhân viên gần đây'} />
    </div>
  );
}
