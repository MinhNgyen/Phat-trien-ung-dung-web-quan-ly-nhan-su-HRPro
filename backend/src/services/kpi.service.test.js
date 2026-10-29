jest.mock('../config/database', () => ({}));

const { computeFromTasks, WEIGHTS, periodOf } = require('./kpi.service');

describe('WEIGHTS', () => {
  it('40 / 30 / 30', () => {
    expect(WEIGHTS).toEqual({ completion: 0.4, onTime: 0.3, quality: 0.3 });
  });
});

describe('periodOf', () => {
  it('lấy YYYY-MM từ dueDate', () => {
    expect(periodOf('2026-10-25')).toBe('2026-10');
    expect(periodOf(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01');
  });
});

describe('computeFromTasks', () => {
  it('không có việc / toàn hủy → null', () => {
    expect(computeFromTasks([])).toBeNull();
    expect(computeFromTasks([{ status: 'CANCELLED', weight: 5 }])).toBeNull();
  });

  it('xong hết, đúng hạn, chất lượng 100 → 100', () => {
    const t = { status: 'DONE', weight: 2, quality: 100, dueDate: '2026-10-10', completedAt: '2026-10-10' };
    expect(computeFromTasks([t]).total).toBe(100);
  });

  it('nửa việc xong đúng hạn, chất lượng 100 → 80', () => {
    const stats = computeFromTasks([
      { status: 'DONE', weight: 2, quality: 100, dueDate: '2026-10-10', completedAt: '2026-10-10' },
      { status: 'TODO', weight: 2, dueDate: '2026-10-20' },
    ]);
    expect(stats).toEqual({
      totalTasks: 2, doneTasks: 1, onTimeTasks: 1,
      completionRate: 50, onTimeRate: 100, qualityScore: 100, total: 80,
    });
  });

  it('xong trễ: đúng hạn 0, chất lượng 80 → 64', () => {
    const stats = computeFromTasks([
      { status: 'DONE', weight: 1, quality: 80, dueDate: '2026-10-10', completedAt: '2026-10-12' },
    ]);
    expect(stats.completionRate).toBe(100);
    expect(stats.onTimeRate).toBe(0);
    expect(stats.qualityScore).toBe(80);
    expect(stats.total).toBe(64);
  });

  it('việc REVIEW chưa tính hoàn thành; việc hủy không vào mẫu số', () => {
    const stats = computeFromTasks([
      { status: 'REVIEW', weight: 3, dueDate: '2026-10-10' },
      { status: 'CANCELLED', weight: 5, dueDate: '2026-10-10' },
    ]);
    expect(stats.totalTasks).toBe(1);
    expect(stats.doneTasks).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.total).toBe(0);
  });

  it('chất lượng / đúng hạn theo trọng số', () => {
    const stats = computeFromTasks([
      { status: 'DONE', weight: 3, quality: 100, dueDate: '2026-10-10', completedAt: '2026-10-10' },
      { status: 'DONE', weight: 1, quality: 0, dueDate: '2026-10-10', completedAt: '2026-10-20' },
    ]);
    expect(stats.qualityScore).toBe(75);
    expect(stats.onTimeRate).toBe(75);
  });
});
