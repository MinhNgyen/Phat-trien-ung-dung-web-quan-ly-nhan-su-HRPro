import { fmtScore } from '@/lib/format';

export function StatusBadge({ status }) {
  if (status === 'ACTIVE') return <span className="badge badge-success">Đang làm</span>;
  if (status === 'LEAVE') return <span className="badge badge-warning">Nghỉ phép</span>;
  return <span className="badge badge-gray">Đã nghỉ việc</span>;
}

export function KpiBadge({ value }) {
  if (value == null) return <span className="badge badge-gray">—</span>;
  const cls = value >= 90 ? 'badge-success' : value >= 75 ? 'badge-info' : value >= 60 ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{fmtScore(value)}</span>;
}
