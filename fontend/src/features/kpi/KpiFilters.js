'use client';
import { RANK_FILTERS } from './kpiUtils';

export default function KpiFilters({ filters, onChange, depts, counts, shown }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="toolbar">
      <input className="form-control" style={{ minWidth: 200 }} value={filters.q} onChange={(e) => set('q', e.target.value)} placeholder="🔍 Tìm tên / mã nhân viên..." />
      <select className="form-control" value={filters.dept} onChange={(e) => set('dept', e.target.value)}>
        <option value="">Tất cả phòng ban</option>
        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {RANK_FILTERS.map((f) => (
          <button key={f.key} type="button" className={'chip' + (filters.rank === f.key ? ' active' : '')} onClick={() => set('rank', f.key)}>
            {f.label} <span className="n">{counts[f.key]}</span>
          </button>
        ))}
      </div>
      <span className="spacer" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Hiển thị {shown}</span>
    </div>
  );
}
