// Logic THUẦN của đầu việc. Trạng thái khớp backend (task.validator.js).
export const TASK_STATUSES = {
  TODO: { key: 'TODO', label: 'Chưa làm', cls: 'badge-gray', tone: 'gray' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'Đang làm', cls: 'badge-info', tone: 'info' },
  REVIEW: { key: 'REVIEW', label: 'Chờ duyệt', cls: 'badge-warning', tone: 'warning' },
  DONE: { key: 'DONE', label: 'Hoàn thành', cls: 'badge-success', tone: 'success' },
  CANCELLED: { key: 'CANCELLED', label: 'Đã hủy', cls: 'badge-gray', tone: 'gray' },
};

export const KANBAN_COLUMNS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const WEIGHT_LABELS = { 1: 'Nhẹ', 2: 'Trung bình', 3: 'Quan trọng', 4: 'Khó', 5: 'Rất khó' };

export const statusOf = (s) => TASK_STATUSES[s] || TASK_STATUSES.TODO;

export const dayOf = (d) => (d ? String(d).slice(0, 10) : '');

export const isOnTime = (t) => t.status === 'DONE' && t.completedAt && dayOf(t.completedAt) <= dayOf(t.dueDate);

export function isOverdue(t, today) {
  if (t.status === 'DONE' || t.status === 'CANCELLED') return false;
  return dayOf(t.dueDate) < today;
}

export const weightMarks = (n) => '●'.repeat(n || 1) + '○'.repeat(Math.max(0, 5 - (n || 1)));

export function emptyTaskForm(employeeId = '', today) {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() + 7);
  const due = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { employeeId: employeeId ? String(employeeId) : '', title: '', description: '', dueDate: due, weight: '3' };
}

export function formFromTask(t) {
  return {
    employeeId: String(t.employeeId),
    title: t.title || '',
    description: t.description || '',
    dueDate: dayOf(t.dueDate),
    weight: String(t.weight || 1),
  };
}

export function toTaskPayload(form) {
  return {
    employeeId: Number(form.employeeId),
    title: form.title.trim(),
    description: form.description.trim() || null,
    dueDate: form.dueDate,
    weight: Number(form.weight) || 1,
  };
}

export function validateTask(form) {
  if (!form.employeeId) return 'Chọn nhân viên nhận việc';
  if (!form.title.trim()) return 'Nhập tiêu đề việc';
  if (!form.dueDate) return 'Chọn hạn hoàn thành';
  const w = Number(form.weight);
  if (!Number.isInteger(w) || w < 1 || w > 5) return 'Trọng số từ 1 đến 5';
  return null;
}

export function filterTasks(tasks, { q = '', employeeId = '', status = '' } = {}) {
  const needle = q.toLowerCase().trim();
  return tasks.filter((t) => {
    if (status && t.status !== status) return false;
    if (employeeId && String(t.employeeId) !== String(employeeId)) return false;
    if (needle) {
      const name = (t.employee && t.employee.name) || '';
      const code = (t.employee && t.employee.employeeCode) || '';
      if (!t.title.toLowerCase().includes(needle) && !name.toLowerCase().includes(needle) && !code.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

export function groupByStatus(tasks) {
  const map = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [], CANCELLED: [] };
  tasks.forEach((t) => { (map[t.status] || map.TODO).push(t); });
  return map;
}

export function taskCounts(tasks) {
  const c = { '': tasks.length, TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CANCELLED: 0 };
  tasks.forEach((t) => { if (c[t.status] != null) c[t.status] += 1; });
  return c;
}

// Nhân viên chỉ được đẩy việc tới REVIEW. Quản lý duyệt sang DONE.
export function nextOwnStatus(status) {
  if (status === 'TODO') return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'REVIEW';
  return null;
}

export function ownActionLabel(status) {
  if (status === 'TODO') return 'Bắt đầu';
  if (status === 'IN_PROGRESS') return 'Báo xong';
  return null;
}
