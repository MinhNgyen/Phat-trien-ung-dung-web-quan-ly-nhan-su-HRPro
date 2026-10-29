'use client';
import { BUCKETS } from './payrollUtils';

export default function SalaryToolbar({ q, onQ, dept, onDept, depts, bucket, onClearBucket, shown, total }) {
  return (
    <div className="toolbar">
      <input className="form-control" style={{ minWidth: 200 }} value={q} onChange={(e) => onQ(e.target.value)} placeholder="🔍 Tìm tên / mã nhân viên..." />
      <select className="form-control" value={dept} onChange={(e) => onDept(e.target.value)}>
        <option value="">Tất cả phòng ban</option>
        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {bucket != null && <button type="button" className="chip active removable" onClick={onClearBucket}>Mức lương {BUCKETS[bucket].label}</button>}
      <span className="spacer" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Hiển thị {shown}/{total} phiếu lương</span>
    </div>
  );
}
