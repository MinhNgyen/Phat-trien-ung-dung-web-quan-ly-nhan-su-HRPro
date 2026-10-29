'use client';
import { useMemo, useState } from 'react';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useNotifications } from '@/context/NotificationsContext';
import { useRefs } from '@/context/RefsContext';
import { downloadCSV } from '@/lib/csv';
import PayslipModal from './PayslipModal';
import SalaryDistChart from './SalaryDistChart';
import SalaryStats from './SalaryStats';
import SalaryStatus from './SalaryStatus';
import SalaryTable from './SalaryTable';
import SalaryToolbar from './SalaryToolbar';
import { emptyMessage, filterPayroll, nextSort, payrollCsvRows, sortPayroll, summarize, totalsOf } from './payrollUtils';
import { useCompanyName } from './useCompanyName';
import { usePayrollPeriod } from './usePayrollPeriod';

export default function SalaryPage() {
  const { depts } = useRefs();
  const { refresh: refreshNotifications } = useNotifications();
  const getCompany = useCompanyName();
  const { month, setMonth, data, canManage, canToggleLock, calculate, toggleLock } = usePayrollPeriod({ onChanged: refreshNotifications });
  const [bucket, setBucket] = useState(null); // cột đang chọn trong biểu đồ
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(null);
  const [payslip, setPayslip] = useState(null); // { p, company }

  const summary = useMemo(() => summarize(data.items), [data.items]);
  const totals = useMemo(() => totalsOf(data.items), [data.items]);
  const shown = useMemo(() => sortPayroll(filterPayroll(data.items, { dept, bucket, q }), sort), [data.items, dept, bucket, q, sort]);

  async function openPayslip(p) { setPayslip({ p, company: await getCompany() }); }

  function exportCsv() {
    if (!canManage) { alert('Chỉ Kế toán/Admin được xuất bảng lương'); return; }
    downloadCSV(`bang_luong_${month}.csv`, payrollCsvRows(data.items));
  }

  return (
    <div className="page active modern">
      <PageHeader title="Tính lương" subtitle={`Bảng lương kỳ ${month} — tính từ bảng công thật + cấu hình ở trang Cài đặt`}>
        <input className="form-control" type="month" value={month} style={{ width: 160 }} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <Can roles="admin,accountant"><button type="button" className="btn btn-primary" onClick={calculate}>🧮 Tính lương kỳ này</button></Can>
        <button type="button" className="btn btn-outline" onClick={exportCsv}>📄 Xuất CSV</button>
      </PageHeader>

      <SalaryStats summary={summary} />

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Phân phối mức lương thực nhận</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bấm cột để lọc bảng</span>
          </div>
          <div className="card-body">
            <SalaryDistChart items={data.items} bucket={bucket} onSelect={(i) => setBucket((cur) => (cur === i ? null : i))} />
          </div>
        </div>
        {/* đã chốt thì chỉ ADMIN được mở khóa */}
        <SalaryStatus month={month} data={data} totals={totals} onToggleLock={toggleLock}
          canToggleLock={canToggleLock} />
      </div>

      <div className="card">
        <SalaryToolbar q={q} onQ={setQ} dept={dept} onDept={setDept} depts={depts} bucket={bucket}
          onClearBucket={() => setBucket(null)} shown={shown.length} total={data.items.length} />
        <SalaryTable items={shown} sort={sort} onSort={(k) => setSort((cur) => nextSort(cur, k))} onPayslip={openPayslip}
          emptyText={emptyMessage(data.items.length > 0, canManage)} />
      </div>

      {payslip && <PayslipModal payslip={payslip.p} company={payslip.company} onClose={() => setPayslip(null)} />}
    </div>
  );
}
