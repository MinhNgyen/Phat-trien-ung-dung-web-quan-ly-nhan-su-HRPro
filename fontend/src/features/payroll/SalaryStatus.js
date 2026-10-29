'use client';
import { fmt } from '@/lib/format';

/** Thẻ trạng thái kỳ lương: đã chốt hay chưa, tổng các khoản, nút chốt/mở khóa. */
export default function SalaryStatus({ month, data, totals, canToggleLock, onToggleLock }) {
  const Row = ({ label, value, color }) => <div className="row"><span>{label}</span><strong style={color ? { color } : undefined}>{value}</strong></div>;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Trạng thái kỳ {month}</div>
        <span className={`badge ${data.isLocked ? 'badge-success' : 'badge-warning'}`}>{data.isLocked ? '✓ Đã chốt' : 'Chưa chốt'}</span>
      </div>
      <div className="card-body pay-status">
        <Row label="Số phiếu lương" value={data.items.length} />
        <Row label="Tổng phụ cấp" value={`+${fmt(totals.allowance)}`} color="var(--success)" />
        <Row label="Tổng tăng ca (OT)" value={`+${fmt(totals.overtime)}`} color="var(--success)" />
        <Row label="Tổng khấu trừ" value={`-${fmt(totals.deduction)}`} color="var(--danger)" />
        <Row label="Thuế TNCN" value={`-${fmt(totals.tax)}`} color="var(--danger)" />
        {canToggleLock && (
          <button type="button" className={`btn ${data.isLocked ? 'btn-outline' : 'btn-success'}`} style={{ justifyContent: 'center' }} onClick={onToggleLock}>
            {data.isLocked ? '🔓 Mở khóa bảng lương' : '🔒 Chốt bảng lương'}
          </button>
        )}
      </div>
    </div>
  );
}
