'use client';
import EmpCell from '@/components/ui/EmpCell';
import { todayStr } from '@/lib/format';
import { dayOf, isOnTime, isOverdue, ownActionLabel, weightMarks } from './taskUtils';

export default function TaskCard({ task, showEmployee, canManage, canUpdateOwn, onStart, onSubmit, onReview, onEdit, onCancel, onDelete }) {
  const overdue = isOverdue(task, todayStr());
  const ownLabel = canUpdateOwn ? ownActionLabel(task.status) : null;
  const open = task.status !== 'DONE' && task.status !== 'CANCELLED';

  return (
    <div className={'task-card' + (overdue ? ' overdue' : '')}>
      <div className="task-card-title">{task.title}</div>
      {showEmployee && task.employee && (
        <div className="task-card-emp"><EmpCell employee={task.employee} sub={task.employee.employeeCode} /></div>
      )}
      <div className="task-card-meta">
        <span className="task-weight" title={`Trọng số ${task.weight}`}>{weightMarks(task.weight)}</span>
        <span className={overdue ? 'task-due late' : 'task-due'}>
          {overdue ? 'Quá hạn ' : 'Hạn '}{dayOf(task.dueDate)}
        </span>
      </div>
      {task.status === 'DONE' && (
        <div className="task-card-done">
          CL {task.quality ?? '—'} · {isOnTime(task) ? 'Đúng hạn' : 'Trễ hạn'}
        </div>
      )}
      <div className="task-card-actions">
        {ownLabel && (
          <button type="button" className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => (task.status === 'TODO' ? onStart(task) : onSubmit(task))}>{ownLabel}</button>
        )}
        {canManage && open && (
          <button type="button" className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onReview(task)}>{task.status === 'REVIEW' ? 'Duyệt' : 'Hoàn thành'}</button>
        )}
        {canManage && (
          <>
            <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onEdit(task)}>Sửa</button>
            {open && <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onCancel(task)}>Hủy</button>}
            <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onDelete(task)}>Xóa</button>
          </>
        )}
      </div>
    </div>
  );
}
