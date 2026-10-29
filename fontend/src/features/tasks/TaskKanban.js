'use client';
import { KANBAN_COLUMNS, TASK_STATUSES, groupByStatus } from './taskUtils';
import TaskCard from './TaskCard';

export default function TaskKanban({ tasks, showEmployee, canManage, ownEmployeeId, onStart, onSubmit, onReview, onEdit, onCancel, onDelete }) {
  const grouped = groupByStatus(tasks);
  return (
    <div className="kanban">
      {KANBAN_COLUMNS.map((key) => {
        const col = TASK_STATUSES[key];
        const items = grouped[key] || [];
        return (
          <div className={`kanban-col ${col.tone}`} key={key}>
            <div className="kanban-col-head">
              <span>{col.label}</span>
              <span className="n">{items.length}</span>
            </div>
            <div className="kanban-cards">
              {items.length === 0 && <div className="kanban-empty">Không có việc</div>}
              {items.map((t) => (
                <TaskCard
                  key={t.id} task={t} showEmployee={showEmployee}
                  canManage={canManage} canUpdateOwn={!!ownEmployeeId && t.employeeId === ownEmployeeId}
                  onStart={onStart} onSubmit={onSubmit} onReview={onReview}
                  onEdit={onEdit} onCancel={onCancel} onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
