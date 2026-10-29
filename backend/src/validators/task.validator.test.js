const { createTaskSchema, taskStatusSchema, recalcSchema } = require('./task.validator');

describe('createTaskSchema', () => {
  it('nhận body hợp lệ, mặc định weight = 1', () => {
    const r = createTaskSchema.parse({ employeeId: '2', title: ' Báo cáo ', dueDate: '2026-10-20' });
    expect(r.employeeId).toBe(2);
    expect(r.title).toBe('Báo cáo');
    expect(r.weight).toBe(1);
  });
  it('từ chối thiếu tiêu đề / trọng số ngoài 1-5', () => {
    expect(() => createTaskSchema.parse({ employeeId: 1, title: '  ', dueDate: '2026-10-20' })).toThrow();
    expect(() => createTaskSchema.parse({ employeeId: 1, title: 'A', dueDate: '2026-10-20', weight: 6 })).toThrow();
  });
});

describe('taskStatusSchema', () => {
  it('nhân viên chỉ được TODO / IN_PROGRESS / REVIEW', () => {
    expect(taskStatusSchema.parse({ status: 'REVIEW' }).status).toBe('REVIEW');
    expect(() => taskStatusSchema.parse({ status: 'DONE' })).toThrow(/TODO, IN_PROGRESS hoặc REVIEW/);
    expect(() => taskStatusSchema.parse({ status: 'CANCELLED' })).toThrow();
  });
});

describe('recalcSchema', () => {
  it('period YYYY-MM', () => {
    expect(recalcSchema.parse({ period: '2026-10' }).period).toBe('2026-10');
    expect(() => recalcSchema.parse({ period: '2026/10' })).toThrow();
  });
});
