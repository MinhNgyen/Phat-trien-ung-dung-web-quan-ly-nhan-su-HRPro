'use client';

export default function EmployeeFilters({ filters, onChange, depts }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <input className="form-control" style={{ width: 200 }} value={filters.q} onChange={set('q')} placeholder="🔍 Tìm tên / mã NV..." />
      <select className="form-control" style={{ width: 160 }} value={filters.dept} onChange={set('dept')}>
        <option value="">Tất cả phòng ban</option>
        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className="form-control" style={{ width: 150 }} value={filters.status} onChange={set('status')}>
        <option value="">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang làm</option>
        <option value="LEAVE">Nghỉ phép</option>
        <option value="INACTIVE">Đã nghỉ việc</option>
      </select>
    </div>
  );
}
