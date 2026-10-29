'use client';
import { fmt, fmtScore } from '@/lib/format';
import { DEFAULT_COLOR } from './departmentUtils';

export default function DepartmentCard({ dept, stats, canEdit, onEdit, onDelete }) {
  const color = dept.color || DEFAULT_COLOR;
  return (
    <div className="card dept-detail-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div className="dept-badge" style={{ background: color }}>{dept.code}</div>
            <h3 style={{ margin: '10px 0 2px' }}>{dept.name}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>{dept.description || ''}</p>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" className="icon-btn" onClick={() => onEdit(dept)}>✏️</button>
              <button type="button" className="icon-btn" onClick={() => onDelete(dept)}>🗑️</button>
            </div>
          )}
        </div>
        <div className="dept-stats">
          <div><div className="ds-num">{stats.count}</div><div className="ds-lbl">Nhân viên</div></div>
          <div><div className="ds-num">{stats.avgKpi ? fmtScore(stats.avgKpi) : '—'}</div><div className="ds-lbl">KPI TB</div></div>
          <div><div className="ds-num">{fmt(stats.salarySum / 1e6)}tr</div><div className="ds-lbl">Quỹ lương</div></div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Trưởng phòng:</span> <strong>{dept.head || '—'}</strong>
        </div>
      </div>
    </div>
  );
}
