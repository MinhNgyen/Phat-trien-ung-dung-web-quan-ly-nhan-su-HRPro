'use client';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { fmtScore } from '@/lib/format';
import { progressColor, rankOf } from './kpiUtils';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function KpiTable({ ranked, onView }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>Hạng</th><th>Nhân viên</th><th>Phòng ban</th><th>Việc</th><th>Điểm KPI</th><th>Xếp loại</th><th /></tr>
        </thead>
        <tbody>
          {ranked.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>Không có nhân viên phù hợp</td></tr>}
          {ranked.map((r) => {
            const k = r.rec ? r.rec.total : null;
            const rk = k == null ? null : rankOf(k);
            return (
              <tr key={r.e.id}>
                <td style={{ width: 56 }}>{r.rec && MEDAL[r.pos] ? <span style={{ fontSize: 18 }}>{MEDAL[r.pos]}</span> : r.pos}</td>
                <td><EmpCell employee={r.e} sub={r.e.position || r.e.employeeCode} /></td>
                <td><DeptTag dept={r.e.department} /></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {r.rec ? `${r.rec.doneTasks}/${r.rec.totalTasks}` : '—'}
                </td>
                <td>
                  <div className="kpi-cell">
                    <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: `${k || 0}%`, background: progressColor(k) }} /></div>
                    <strong>{k == null ? '—' : fmtScore(k)}</strong>
                  </div>
                </td>
                <td>{rk ? <span className={`badge ${rk.cls}`}>{rk.lbl}</span> : <span className="badge badge-gray">Chưa có việc</span>}</td>
                <td><button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onView(r.e)}>Xem việc</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
