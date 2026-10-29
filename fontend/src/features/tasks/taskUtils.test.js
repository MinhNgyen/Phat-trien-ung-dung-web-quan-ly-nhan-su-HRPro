import { describe, it, expect } from 'vitest';
import {
  emptyTaskForm, filterTasks, formFromTask, groupByStatus, isOnTime, isOverdue,
  nextOwnStatus, ownActionLabel, taskCounts, toTaskPayload, validateTask, weightMarks,
} from './taskUtils';

describe('ngày / hạn', () => {
  const open = { status: 'TODO', dueDate: '2026-10-10' };
  it('isOverdue: việc mở quá hạn', () => {
    expect(isOverdue(open, '2026-10-11')).toBe(true);
    expect(isOverdue(open, '2026-10-10')).toBe(false);
    expect(isOverdue({ ...open, status: 'DONE' }, '2026-10-11')).toBe(false);
    expect(isOverdue({ ...open, status: 'CANCELLED' }, '2026-10-11')).toBe(false);
  });
  it('isOnTime chỉ việc DONE và completedAt ≤ dueDate', () => {
    expect(isOnTime({ status: 'DONE', dueDate: '2026-10-10', completedAt: '2026-10-10' })).toBe(true);
    expect(isOnTime({ status: 'DONE', dueDate: '2026-10-10', completedAt: '2026-10-11' })).toBe(false);
    expect(isOnTime({ status: 'REVIEW', dueDate: '2026-10-10', completedAt: '2026-10-09' })).toBe(false);
  });
});

describe('form', () => {
  it('emptyTaskForm hạn mặc định +7 ngày', () => {
    expect(emptyTaskForm(5, '2026-10-10')).toEqual({
      employeeId: '5', title: '', description: '', dueDate: '2026-10-17', weight: '3',
    });
  });
  it('validateTask / toTaskPayload', () => {
    expect(validateTask(emptyTaskForm('', '2026-10-10'))).toMatch(/nhân viên/i);
    expect(validateTask({ employeeId: '1', title: '  ', description: '', dueDate: '2026-10-10', weight: '3' })).toMatch(/tiêu đề/i);
    const ok = { employeeId: '2', title: ' Báo cáo ', description: '  ', dueDate: '2026-10-20', weight: '4' };
    expect(validateTask(ok)).toBeNull();
    expect(toTaskPayload(ok)).toEqual({ employeeId: 2, title: 'Báo cáo', description: null, dueDate: '2026-10-20', weight: 4 });
  });
  it('formFromTask', () => {
    expect(formFromTask({ employeeId: 9, title: 'A', description: null, dueDate: '2026-10-05', weight: 2 }))
      .toEqual({ employeeId: '9', title: 'A', description: '', dueDate: '2026-10-05', weight: '2' });
  });
});

describe('lọc / nhóm', () => {
  const tasks = [
    { id: 1, title: 'API login', status: 'TODO', employeeId: 1, employee: { name: 'An', employeeCode: 'NV1' } },
    { id: 2, title: 'Báo cáo tuần', status: 'REVIEW', employeeId: 2, employee: { name: 'Bình', employeeCode: 'NV2' } },
    { id: 3, title: 'Sửa lỗi', status: 'DONE', employeeId: 1, employee: { name: 'An', employeeCode: 'NV1' } },
    { id: 4, title: 'Hủy', status: 'CANCELLED', employeeId: 3, employee: { name: 'Chi', employeeCode: 'NV3' } },
  ];
  it('filterTasks theo từ khóa, người, trạng thái', () => {
    expect(filterTasks(tasks, { q: 'bình' }).map((t) => t.id)).toEqual([2]);
    expect(filterTasks(tasks, { employeeId: '1' }).map((t) => t.id)).toEqual([1, 3]);
    expect(filterTasks(tasks, { status: 'REVIEW' }).map((t) => t.id)).toEqual([2]);
  });
  it('groupByStatus và taskCounts', () => {
    const g = groupByStatus(tasks);
    expect(g.TODO).toHaveLength(1);
    expect(g.REVIEW).toHaveLength(1);
    expect(g.DONE).toHaveLength(1);
    expect(g.CANCELLED).toHaveLength(1);
    expect(g.IN_PROGRESS).toHaveLength(0);
    expect(taskCounts(tasks)).toEqual({ '': 4, TODO: 1, IN_PROGRESS: 0, REVIEW: 1, DONE: 1, CANCELLED: 1 });
  });
});

describe('hành động nhân viên', () => {
  it('chỉ TODO → IN_PROGRESS → REVIEW', () => {
    expect(nextOwnStatus('TODO')).toBe('IN_PROGRESS');
    expect(nextOwnStatus('IN_PROGRESS')).toBe('REVIEW');
    expect(nextOwnStatus('REVIEW')).toBeNull();
    expect(ownActionLabel('TODO')).toBe('Bắt đầu');
    expect(ownActionLabel('IN_PROGRESS')).toBe('Báo xong');
  });
  it('weightMarks', () => {
    expect(weightMarks(3)).toBe('●●●○○');
    expect(weightMarks(5)).toBe('●●●●●');
  });
});
