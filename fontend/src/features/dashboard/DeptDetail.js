'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { canOpen } from '@/lib/permissions';
import { fmt, fmtScore } from '@/lib/format';

/** Thanh chi tiết 1 phòng ban, hiện khi người dùng bấm vào biểu đồ. */
export default function DeptDetail({ detail, color, onClear }) {
  const { user } = useAuth();
  return (
    <div className="card dept-detail" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="dd-name"><span className="dd-dot" style={{ background: color }} />{detail.name}</div>
      <div className="dd-metric"><strong>{detail.count}</strong>nhân viên ({detail.active} đang làm)</div>
      <div className="dd-metric"><strong>{fmt(detail.salarySum / 1e6)}tr</strong>quỹ lương cơ bản</div>
      <div className="dd-metric"><strong>{detail.avgKpi == null ? '—' : fmtScore(detail.avgKpi)}</strong>KPI trung bình</div>
      <div className="dd-actions">
        {detail.id && canOpen(user, '/employees') && (
          <Link href={`/employees?dept=${detail.id}`} className="btn btn-outline" style={{ fontSize: 12.5 }}>Xem nhân viên →</Link>
        )}
        <button type="button" className="btn btn-outline" style={{ fontSize: 12.5 }} onClick={onClear}>Bỏ chọn</button>
      </div>
    </div>
  );
}
