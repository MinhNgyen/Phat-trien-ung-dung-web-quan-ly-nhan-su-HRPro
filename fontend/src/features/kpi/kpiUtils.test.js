import { describe, it, expect } from 'vitest';
import { buildKpiPayload, buildRanking, calcTotal, clampScore, deptAverages, kpiCsvRows, progressColor, rankOf, recentPeriods, topThree } from './kpiUtils';

describe('recentPeriods', () => {
  it('12 kỳ, mới nhất trước, qua năm đúng', () => {
    const p = recentPeriods(12, new Date(2026, 1, 15)); // tháng 2/2026
    expect(p).toHaveLength(12);
    expect(p[0]).toBe('2026-02');
    expect(p[2]).toBe('2025-12');
    expect(p[11]).toBe('2025-03');
  });
});

describe('điểm', () => {
  it('clampScore giới hạn 0–100', () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore('abc')).toBe(0);
  });
  it('calcTotal theo trọng số', () => {
    expect(calcTotal({ sales: 100, attendance: 100, task: 100, deadline: 100, quality: 100 })).toBeCloseTo(100);
    expect(calcTotal({ sales: 80, attendance: 0, task: 0, deadline: 0, quality: 0 })).toBeCloseTo(20);
  });
  it('rankOf theo ngưỡng', () => {
    expect(rankOf(90).lbl).toBe('Xuất sắc');
    expect(rankOf(80).lbl).toBe('Tốt');
    expect(rankOf(70).lbl).toBe('Khá');
    expect(rankOf(69.9).lbl).toBe('Cần cải thiện');
  });
  it('progressColor', () => {
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

  it('sắp xếp giảm dần, người chưa chấm xuống cuối', () => {
    expect(ranked.map((r) => r.e.id)).toEqual([2, 3, 1, 4]);
    expect(ranked[3].rec).toBeNull();
  });
  it('top 3 bỏ qua người chưa chấm', () => { expect(topThree(ranked).map((r) => r.e.id)).toEqual([2, 3, 1]); });
  it('trung bình theo phòng ban', () => {
    expect(deptAverages(ranked, () => '#000')).toEqual([
      { name: 'KT', avg: 80, color: '#000' }, { name: 'NS', avg: 80, color: '#000' },
    ]);
  });
  it('CSV có hàng tiêu đề và "Chưa chấm"', () => {
    const rows = kpiCsvRows(ranked);
    expect(rows).toHaveLength(5);
    expect(rows[4][5]).toBe('Chưa chấm');
  });
});

describe('buildKpiPayload', () => {
  it('ép điểm về 0–100 và gắn người đánh giá', () => {
    const p = buildKpiPayload({ sales: '120', attendance: '50', task: '', deadline: 70, quality: -1 }, 7, '2026-10', 'Admin');
    expect(p).toEqual({ employeeId: 7, period: '2026-10', evaluatedBy: 'Admin', sales: 100, attendance: 50, task: 0, deadline: 70, quality: 0 });
  });
});

import { filterRanking, kpiSummary, rankCounts, rankKeyOf } from './kpiUtils';

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
