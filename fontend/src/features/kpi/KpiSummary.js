import { fmtScore } from '@/lib/format';

export default function KpiSummary({ summary }) {
  return (
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon" style={{ background: '#fdf2f8' }}>🎯</div>
        <div className="stat-value">{summary.avg == null ? '—' : fmtScore(summary.avg)}</div><div className="stat-label">KPI trung bình</div></div>
      <div className="stat-card"><div className="stat-icon" style={{ background: '#eff6ff' }}>📝</div>
        <div className="stat-value">{summary.rated}/{summary.total}</div><div className="stat-label">Nhân viên đã được chấm</div></div>
      <div className="stat-card"><div className="stat-icon" style={{ background: '#f0fdf4' }}>🏆</div>
        <div className="stat-value" style={{ color: 'var(--success)' }}>{summary.excellent}</div><div className="stat-label">Xuất sắc (≥ 90)</div></div>
      <div className="stat-card"><div className="stat-icon" style={{ background: '#fef2f2' }}>⚠️</div>
        <div className="stat-value" style={{ color: 'var(--danger)' }}>{summary.poor}</div><div className="stat-label">Cần cải thiện (&lt; 70)</div></div>
    </div>
  );
}
