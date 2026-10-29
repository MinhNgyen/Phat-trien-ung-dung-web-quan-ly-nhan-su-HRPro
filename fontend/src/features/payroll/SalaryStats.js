import { fmt } from '@/lib/format';

export default function SalaryStats({ summary }) {
  return (
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{fmt(summary.total)}</div><div className="stat-label">Tổng thực chi (VNĐ)</div></div>
      <div className="stat-card"><div className="stat-value">{fmt(summary.avg)}</div><div className="stat-label">Thực nhận TB / người</div></div>
      <div className="stat-card"><div className="stat-value">{fmt(summary.max)}</div><div className="stat-label">Thực nhận cao nhất</div></div>
      <div className="stat-card"><div className="stat-value">{fmt(summary.min)}</div><div className="stat-label">Thực nhận thấp nhất</div></div>
    </div>
  );
}
