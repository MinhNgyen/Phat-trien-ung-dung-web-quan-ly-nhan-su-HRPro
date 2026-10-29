'use client';
import Modal from '@/components/ui/Modal';
import { fmtScore } from '@/lib/format';
import { computeFromTasks, contributionsOf, progressColor, rankOf } from './kpiUtils';
import { dayOf, isOnTime, statusOf, weightMarks } from '../tasks/taskUtils';

/** Chi tiết KPI của 1 nhân viên trong kỳ — công thức + danh sách việc tạo ra điểm. */
export default function KpiDetailModal({ employee, period, tasks, canManage, onClose, onReview, onAssign }) {
  const stats = computeFromTasks(tasks);
  const parts = contributionsOf(stats);
  const rk = stats ? rankOf(stats.total) : null;

  return (
    <Modal
      title={`🎯 KPI ${employee.name} — kỳ ${period}`}
      width={640}
      onClose={onClose}
      footer={<>
        {canManage && <button type="button" className="btn btn-outline" onClick={onAssign}>+ Giao việc</button>}
        <button type="button" className="btn btn-primary" onClick={onClose}>Đóng</button>
      </>}
    >
      <p className="kpi-formula-line">KPI = 40% hoàn thành + 30% đúng hạn + 30% chất lượng (theo trọng số việc, việc hủy không tính).</p>

      {stats ? (
        <>
          <div className="kpi-math">
            {parts.map((p) => (
              <div className="kpi-math-row" key={p.key}>
                <span>{p.label} <span style={{ color: 'var(--text-muted)' }}>× {Math.round(p.weight * 100)}%</span></span>
                <span>
                  <strong>{fmtScore(p.score)}</strong>
                  <span style={{ color: 'var(--text-muted)' }}> → {fmtScore(p.points)}</span>
                </span>
              </div>
            ))}
            <div className="kpi-math-row total">
              <span>KPI tổng</span>
              <span>
                <strong>{fmtScore(stats.total)}</strong>
                {rk && <span className={`badge ${rk.cls}`} style={{ marginLeft: 8 }}>{rk.lbl}</span>}
              </span>
            </div>
          </div>
          <div className="kpi-cell" style={{ margin: '10px 0 16px' }}>
            <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: `${stats.total}%`, background: progressColor(stats.total) }} /></div>
            <strong>{fmtScore(stats.total)}</strong>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
            {stats.doneTasks}/{stats.totalTasks} việc hoàn thành · {stats.onTimeTasks} đúng hạn
          </p>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 14 }}>Chưa có đầu việc trong kỳ này.</p>
      )}

      <div className="task-mini-list">
        {tasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Không có việc</div>}
        {tasks.map((t) => {
          const st = statusOf(t.status);
          return (
            <div className="task-mini" key={t.id}>
              <div className="grow">
                <div className="task-card-title">{t.title}</div>
                <div className="task-card-meta">
                  <span className="task-weight">{weightMarks(t.weight)}</span>
                  <span>Hạn {dayOf(t.dueDate)}</span>
                  {t.status === 'DONE' && <span>{isOnTime(t) ? 'Đúng hạn' : 'Trễ hạn'} · CL {t.quality}</span>}
                </div>
              </div>
              <span className={`badge ${st.cls}`}>{st.label}</span>
              {canManage && t.status === 'REVIEW' && (
                <button type="button" className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onReview(t)}>Duyệt</button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
