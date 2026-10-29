import { describe, it, expect } from 'vitest';
import {
  buildRanking, computeFromTasks, contributionsOf, CRITERIA, deptAverages, filterRanking,
  kpiCsvRows, kpiSummary, progressColor, rankCounts, rankKeyOf, rankOf, recentPeriods, topThree, WEIGHTS,
} from './kpiUtils';

describe('recentPeriods', () => {
  it('12 kỳ, mới nhất trước, qua năm đúng', () => {
    const p = recentPeriods(12, new Date(2026, 1, 15));
    expect(p).toHaveLength(12);
    expect(p[0]).toBe('2026-02');
    expect(p[2]).toBe('2025-12');
    expect(p[11]).toBe('2025-03');
  });
});

describe('công thức KPI từ đầu việc', () => {
  it('trọng số 40/30/30', () => {
    expect(WEIGHTS).toEqual({ completion: 0.4, onTime: 0.3, quality: 0.3 });
    expect(CRITERIA.map((c) => c.weight)).toEqual([0.4, 0.3, 0.3]);
  });
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
  it('contributionsOf', () => {
    const pts = contributionsOf({ completionRate: 50, onTimeRate: 100, qualityScore: 100 });
    expect(pts.map((p) => p.points)).toEqual([20, 30, 30]);
  });
  it('rankOf / progressColor', () => {
    expect(rankOf(90).lbl).toBe('Xuất sắc');
    expect(rankOf(80).lbl).toBe('Tốt');
    expect(rankOf(70).lbl).toBe('Khá');
    expect(rankOf(69.9).lbl).toBe('Cần cải thiện');
    expect(progressColor(85)).toBe('var(--success)');
    expect(progressColor(null)).toBe('var(--danger)');
  });
});

describe('xếp hạng', () => {
  const emps = [
    { id: 1, name: 'A', department: { id: 1, name: 'KT' } },
    { id: 2, name: 'B', department: { id: 1, name: 'KT' } },
    { id: 3, name: 'C', department: { id: 2, name: 'NS' } },
    { id: 4, name: 'D' },
  ];
  const records = [{ employeeId: 1, total: 70 }, { employeeId: 2, total: 90 }, { employeeId: 3, total: 80 }];
  const ranked = buildRanking(emps, records);

  it('sắp xếp giảm dần, người chưa có việc xuống cuối', () => {
    expect(ranked.map((r) => r.e.id)).toEqual([2, 3, 1, 4]);
    expect(ranked[3].rec).toBeNull();
  });
  it('top 3 bỏ qua người chưa có KPI', () => { expect(topThree(ranked).map((r) => r.e.id)).toEqual([2, 3, 1]); });
  it('trung bình theo phòng ban', () => {
    expect(deptAverages(ranked, () => '#000')).toEqual([
      { name: 'KT', avg: 80, color: '#000' }, { name: 'NS', avg: 80, color: '#000' },
    ]);
  });
  it('CSV có hàng tiêu đề và "Chưa có việc"', () => {
    const rows = kpiCsvRows(ranked);
    expect(rows).toHaveLength(5);
    expect(rows[0][11]).toBe('Xếp loại');
    expect(rows[4][11]).toBe('Chưa có việc');
  });
});

describe('lọc & tổng hợp KPI', () => {
  const emps = [
    { id: 1, name: 'An', employeeCode: 'NV1', department: { id: 1, name: 'KT' } },
    { id: 2, name: 'Bình', employeeCode: 'NV2', department: { id: 2, name: 'NS' } },
    { id: 3, name: 'Chi', employeeCode: 'NV3', department: { id: 1, name: 'KT' } },
    { id: 4, name: 'Dũng', employeeCode: 'NV4' },
  ];
  const ranked = buildRanking(emps, [{ employeeId: 1, total: 95 }, { employeeId: 2, total: 82 }, { employeeId: 3, total: 55 }]);

  it('buildRanking gắn thứ hạng pos', () => { expect(ranked.map((r) => r.pos)).toEqual([1, 2, 3, 4]); });
  it('rankKeyOf theo ngưỡng', () => {
    expect([95, 80, 70, 69, null].map((t) => rankKeyOf(t == null ? null : { total: t }))).toEqual(['excellent', 'good', 'fair', 'poor', 'none']);
  });
  it('rankCounts và kpiSummary', () => {
    expect(rankCounts(ranked)).toEqual({ '': 4, excellent: 1, good: 1, fair: 0, poor: 1, none: 1 });
    const s = kpiSummary(ranked);
    expect(s.rated).toBe(3);
    expect(s.total).toBe(4);
    expect(s.avg).toBeCloseTo((95 + 82 + 55) / 3);
    expect(s.excellent).toBe(1);
    expect(s.poor).toBe(1);
    expect(kpiSummary([]).avg).toBeNull();
  });
  it('filterRanking: từ khóa, phòng ban, xếp loại; thứ hạng pos giữ nguyên', () => {
    expect(filterRanking(ranked, { q: 'bình' }).map((r) => r.e.id)).toEqual([2]);
    expect(filterRanking(ranked, { dept: '1' }).map((r) => r.e.id)).toEqual([1, 3]);
    expect(filterRanking(ranked, { rank: 'none' }).map((r) => r.e.id)).toEqual([4]);
    expect(filterRanking(ranked, { dept: '1', rank: 'poor' })[0].pos).toBe(3);
  });
});
