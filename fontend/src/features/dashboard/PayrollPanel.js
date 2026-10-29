'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import EmpCell from '@/components/ui/EmpCell';
import { curMonth, fmt } from '@/lib/format';
import PayslipModal from '../payroll/PayslipModal';
import { payrollSnapshot, shiftMonth } from '../payroll/payrollUtils';
import { useCompanyName } from '../payroll/useCompanyName';
import { usePayrollPeriod } from '../payroll/usePayrollPeriod';

const STATE_LABEL = { none: 'Chưa tính', draft: 'Đã tính · chưa chốt', locked: 'Đã chốt' };
const STATE_BADGE = { none: 'badge-gray', draft: 'badge-warning', locked: 'badge-success' };

/** Kế toán/Admin: đổi kỳ, tính lương, chốt/mở khóa và xem nhanh phiếu lương cao nhất ngay tại Dashboard. */
export default function PayrollPanel({ onChanged }) {
  const { month, setMonth, data, canToggleLock, busy, calculate, toggleLock } = usePayrollPeriod({ onChanged });
  const getCompany = useCompanyName();
  const [payslip, setPayslip] = useState(null);
  const snap = useMemo(() => payrollSnapshot(data), [data]);
  const calculated = snap.state !== 'none';

  async function openPayslip(p) { setPayslip({ p, company: await getCompany() }); }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Bảng lương</div>
        <div className="month-nav">
          <button type="button" title="Kỳ trước" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <strong>{month}</strong>
          <button type="button" title="Kỳ sau" disabled={month >= curMonth()} onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
      </div>

      <div className="steps">
        <div className={'step ' + (calculated ? 'done' : 'current')}><span className="dot">{calculated ? '✓' : '1'}</span>Tính lương</div>
        <div className={'bar' + (calculated ? ' done' : '')} />
        <div className={'step ' + (snap.state === 'locked' ? 'done' : calculated ? 'current' : '')}><span className="dot">{snap.state === 'locked' ? '✓' : '2'}</span>Chốt lương</div>
        <span className={`badge ${STATE_BADGE[snap.state]}`}>{STATE_LABEL[snap.state]}</span>
      </div>

      <div className="metric-row">
        <div><strong>{snap.count}</strong>phiếu lương</div>
        <div><strong>{fmt(snap.totalNet)}</strong>tổng thực chi (VNĐ)</div>
        <div><strong>{fmt(snap.avgNet)}</strong>thực nhận trung bình</div>
      </div>

      <div className="panel-actions">
        {snap.state !== 'locked' && (
          <button type="button" className={`btn ${calculated ? 'btn-outline' : 'btn-primary'}`} disabled={busy} onClick={calculate}>
            🧮 {calculated ? 'Tính lại' : 'Tính lương kỳ này'}
          </button>
        )}
        {snap.state === 'draft' && canToggleLock && <button type="button" className="btn btn-success" disabled={busy} onClick={toggleLock}>🔒 Chốt lương</button>}
        {snap.state === 'locked' && canToggleLock && <button type="button" className="btn btn-outline" disabled={busy} onClick={toggleLock}>🔓 Mở khóa</button>}
        <Link href="/salary" className="btn btn-outline">Mở trang lương →</Link>
      </div>

      <div className="panel-list">
        {snap.top.length === 0 && <div className="panel-empty">Chưa có phiếu lương trong kỳ này</div>}
        {snap.top.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>Thực nhận cao nhất</div>}
        {snap.top.map((p) => (
          <div className="panel-row" key={p.id}>
            <div className="grow"><EmpCell employee={p.employee} /></div>
            <span className="pill-net">{fmt(p.netSalary)}</span>
            <button type="button" className="icon-btn" title="Xem phiếu lương" onClick={() => openPayslip(p)}>📄</button>
          </div>
        ))}
      </div>

      {payslip && <PayslipModal payslip={payslip.p} company={payslip.company} onClose={() => setPayslip(null)} />}
    </div>
  );
}
