'use client';
import { useEffect, useMemo, useState } from 'react';
import { kpiApi } from '@/api/kpi';
import { payrollApi } from '@/api/payroll';
import { reportsApi } from '@/api/reports';
import Can from '@/components/Can';
import BarChart from '@/components/ui/BarChart';
import PageHeader from '@/components/ui/PageHeader';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { downloadCSV } from '@/lib/csv';
import { groupByDept } from '@/lib/deptStats';
import { curMonth } from '@/lib/format';
import { employeesToCsvRows } from '../employees/employeeUtils';
import { buildRanking, kpiCsvRows } from '../kpi/kpiUtils';
import { payrollCsvRows } from '../payroll/payrollUtils';
import ExportCard from './ExportCard';
import SalaryShare from './SalaryShare';
import { salaryShare } from './reportUtils';

export default function ReportsPage() {
  const { emps, kpiCur, deptColor } = useRefs();
  const { run } = useRun();
  const [byDepartment, setByDepartment] = useState([]); // [{ name, color, employees }]

  useEffect(() => {
    let alive = true;
    run(async () => {
      const rep = await reportsApi.employees();
      if (alive) setByDepartment(rep.byDepartment);
    }, 'Không tải được báo cáo.');
    return () => { alive = false; };
  }, [run]);

  const shares = useMemo(() => salaryShare(groupByDept(emps, deptColor)), [emps, deptColor]);

  // Báo cáo lương / KPI luôn nạp dữ liệu kỳ HIỆN TẠI từ API khi bấm (không phụ thuộc đã mở trang khác hay chưa)
  async function exportSalary() {
    const month = curMonth();
    await run(async () => {
      const { items } = await payrollApi.byMonth(month);
      if (!items.length) { alert(`Chưa tính lương kỳ ${month}. Hãy tính lương ở trang Tính lương trước.`); return; }
      downloadCSV(`bang_luong_${month}.csv`, payrollCsvRows(items));
    }, 'Không xuất được bảng lương.');
  }

  async function exportKpi() {
    const period = curMonth();
    await run(async () => {
      const records = await kpiApi.list({ period });
      downloadCSV(`bao_cao_kpi_${period}.csv`, kpiCsvRows(buildRanking(emps, records)));
    }, 'Không xuất được báo cáo KPI.');
  }

  return (
    <div className="page active">
      <PageHeader title="Báo cáo & Thống kê" subtitle="Tổng hợp tự động từ dữ liệu nhân viên, chấm công và lương" />

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Số nhân viên theo phòng ban</div></div>
          <div className="card-body">
            <BarChart height={140} data={byDepartment.map((d) => ({ label: d.name, value: d.employees, color: d.color || deptColor(d) }))} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Tỷ trọng quỹ lương theo phòng ban</div></div>
          <div className="card-body"><SalaryShare items={shares} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Xuất báo cáo</div></div>
        <div className="card-body">
          <div className="grid-3">
            <ExportCard icon="📊" title="Danh sách nhân viên" desc="Hồ sơ nhân sự đầy đủ" buttonLabel="📤 Xuất CSV"
              onClick={() => downloadCSV('danh_sach_nhan_vien.csv', employeesToCsvRows(emps, kpiCur))} />
            <Can roles="admin,accountant">
              <ExportCard icon="💰" title="Bảng lương tháng" desc="Phụ cấp · OT · khấu trừ · thực nhận" buttonLabel="📄 Xuất CSV" onClick={exportSalary} />
            </Can>
            <ExportCard icon="🎯" title="Báo cáo KPI" desc="Xếp loại · thứ hạng · điểm KPI" buttonLabel="📊 Xuất CSV" onClick={exportKpi} />
          </div>
        </div>
      </div>
    </div>
  );
}
