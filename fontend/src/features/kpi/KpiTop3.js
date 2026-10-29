import EmpAvatar from '@/components/ui/EmpAvatar';
import { fmtScore } from '@/lib/format';

// Bục vinh danh: hạng 2 – hạng 1 – hạng 3
export default function KpiTop3({ top }) {
  if (!top.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có dữ liệu</div>;
  const order = [top[1] && { r: top[1], c: 'p2', m: '🥈' }, top[0] && { r: top[0], c: 'p1', m: '🥇' }, top[2] && { r: top[2], c: 'p3', m: '🥉' }].filter(Boolean);
  return (
    <div className="podium">
      {order.map(({ r, c, m }) => (
        <div className={`pd ${c}`} key={r.e.id}>
          <EmpAvatar employee={r.e} />
          <div className="name">{r.e.name}</div>
          <div className="score">{fmtScore(r.rec.total)}</div>
          <div className="step">{m}</div>
        </div>
      ))}
    </div>
  );
}
