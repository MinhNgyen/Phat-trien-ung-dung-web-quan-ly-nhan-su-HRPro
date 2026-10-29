'use client';
import { useMemo, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { useRun } from '@/hooks/useRun';
import { filterTasks, taskCounts } from './taskUtils';
import TaskCard from './TaskCard';
import TaskKanban from './TaskKanban';

const STATUS_CHIPS = [
  { key: '', label: 'Tất cả' },
  { key: 'TODO', label: 'Chưa làm' },
  { key: 'IN_PROGRESS', label: 'Đang làm' },
  { key: 'REVIEW', label: 'Chờ duyệt' },
  { key: 'DONE', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

export default function TasksPanel({
  tasks, employees, canManage, ownEmployeeId,
  onReview, onEdit, onChanged,
}) {
  const { run } = useRun();
  const [filters, setFilters] = useState({ q: '', employeeId: '', status: '' });
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const shown = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const counts = useMemo(() => taskCounts(tasks), [tasks]);
  const showEmployee = !ownEmployeeId;

  async function onStart(task) {
    await run(async () => { await tasksApi.updateStatus(task.id, 'IN_PROGRESS'); onChanged(); return true; }, 'Không cập nhật được trạng thái.');
  }
  async function onSubmit(task) {
    await run(async () => { await tasksApi.updateStatus(task.id, 'REVIEW'); onChanged(); return true; }, 'Không báo xong được.');
  }
  async function onCancel(task) {
    if (!confirm(`Hủy việc "${task.title}"? Việc đã hủy không tính vào KPI.`)) return;
    await run(async () => { await tasksApi.update(task.id, { status: 'CANCELLED' }); onChanged(); return true; }, 'Không hủy được việc.');
  }
  async function onDelete(task) {
    if (!confirm(`Xóa việc "${task.title}"?`)) return;
    await run(async () => { await tasksApi.remove(task.id); onChanged(); return true; }, 'Không xóa được việc.');
  }

  const cardProps = {
    showEmployee, canManage, ownEmployeeId, onStart, onSubmit, onReview, onEdit, onCancel, onDelete,
  };

  return (
    <div className="card">
      <div className="toolbar">
        <input className="form-control" style={{ minWidth: 200 }} value={filters.q} onChange={(e) => set('q', e.target.value)}
          placeholder={showEmployee ? '🔍 Tìm việc / nhân viên...' : '🔍 Tìm việc...'} />
        {showEmployee && (
          <select className="form-control" value={filters.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
            <option value="">Tất cả nhân viên</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_CHIPS.map((f) => (
            <button key={f.key} type="button" className={'chip' + (filters.status === f.key ? ' active' : '')} onClick={() => set('status', f.key)}>
              {f.label} <span className="n">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36, fontSize: 13.5 }}>
          Chưa có đầu việc trong kỳ này{canManage ? ' — bấm "Giao việc" để bắt đầu.' : '.'}
        </div>
      ) : filters.status === 'CANCELLED' ? (
        <div className="cancelled-list">
          {shown.map((t) => (
            <TaskCard key={t.id} task={t} showEmployee={showEmployee} canManage={canManage}
              canUpdateOwn={false} onStart={onStart} onSubmit={onSubmit} onReview={onReview}
              onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="card-body" style={{ paddingTop: 8 }}>
          <TaskKanban tasks={shown.filter((t) => t.status !== 'CANCELLED')} {...cardProps} />
          {filters.status === '' && counts.CANCELLED > 0 && (
            <div className="cancelled-note">Đã hủy {counts.CANCELLED} việc (không tính vào KPI) — bấm chip "Đã hủy" để xem.</div>
          )}
        </div>
      )}
    </div>
  );
}
