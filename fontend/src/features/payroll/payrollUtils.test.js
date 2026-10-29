import { describe, it, expect } from 'vitest';
import { BUCKETS, bucketCounts, emptyMessage, filterPayroll, incomeOf, inBucket, payrollCsvRows, summarize } from './payrollUtils';

const item = (id, net, deptId) => ({
  id, netSalary: net, baseSalary: 10, allowance: 2, overtime: 1, deduction: 0, grossSalary: 0, tax: 0, workDays: 22, standardDays: 22,
  employee: { employeeCode: `NV${id}`, name: `N${id}`, department: deptId ? { id: deptId, name: `D${deptId}` } : null },
});
const items = [item(1, 9e6, 1), item(2, 10e6, 1), item(3, 24.9e6, 2), item(4, 25e6, null)];

describe('bucket', () => {
  it('biên: min gồm, max không gồm', () => {
    expect(inBucket(10e6, BUCKETS[0])).toBe(false);
    expect(inBucket(10e6, BUCKETS[1])).toBe(true);
    expect(inBucket(25e6, BUCKETS[4])).toBe(true);
  });
  it('đếm theo cột', () => { expect(bucketCounts(items)).toEqual([1, 1, 0, 1, 1]); });
});

describe('summarize', () => {
  it('tổng, TB, cao nhất, thấp nhất', () => {
    const s = summarize(items);
    expect(s.total).toBe(68.9e6);
    expect(s.max).toBe(25e6);
    expect(s.min).toBe(9e6);
    expect(s.avg).toBeCloseTo(17.225e6);
  });
  it('rỗng -> toàn 0 (không ra -Infinity)', () => { expect(summarize([])).toEqual({ total: 0, avg: 0, max: 0, min: 0 }); });
});

describe('filterPayroll', () => {
  it('lọc theo phòng ban, cột, hoặc cả hai', () => {
    expect(filterPayroll(items, { dept: '1' }).map((p) => p.id)).toEqual([1, 2]);
    expect(filterPayroll(items, { bucket: 4 }).map((p) => p.id)).toEqual([4]);
    expect(filterPayroll(items, { dept: '1', bucket: 1 }).map((p) => p.id)).toEqual([2]);
    expect(filterPayroll(items, {})).toHaveLength(4);
  });
});

describe('khác', () => {
  it('incomeOf', () => { expect(incomeOf(items[0])).toBe(13); });
  it('thông báo rỗng', () => {
    expect(emptyMessage(true, true)).toMatch(/bộ lọc/);
    expect(emptyMessage(false, true)).toMatch(/Tính lương kỳ này/);
    expect(emptyMessage(false, false)).toBe('Chưa tính lương cho kỳ này');
  });
  it('CSV có tiêu đề + 1 dòng mỗi bản ghi, phòng ban rỗng thì để trống', () => {
    const rows = payrollCsvRows(items);
    expect(rows).toHaveLength(5);
    expect(rows[4][2]).toBe('');
  });
});

import { nextSort, sortPayroll, totalsOf } from './payrollUtils';

describe('tìm kiếm / sắp xếp / tổng', () => {
  const list = [item(1, 9e6, 1), item(2, 10e6, 1), item(3, 24.9e6, 2)];
  it('lọc theo từ khóa tên hoặc mã', () => {
    expect(filterPayroll(list, { q: 'n2' }).map((p) => p.id)).toEqual([2]);
    expect(filterPayroll(list, { q: 'NV3' }).map((p) => p.id)).toEqual([3]);
  });
  it('sortPayroll theo lương giảm dần, tên tăng dần; null giữ nguyên', () => {
    expect(sortPayroll(list, { key: 'netSalary', dir: 'desc' }).map((p) => p.id)).toEqual([3, 2, 1]);
    expect(sortPayroll(list, { key: 'name', dir: 'asc' }).map((p) => p.id)).toEqual([1, 2, 3]);
    expect(sortPayroll(list, null)).toBe(list);
  });
  it('nextSort xoay vòng: chiều đầu -> đảo chiều -> bỏ', () => {
    const s1 = nextSort(null, 'netSalary');
    expect(s1).toEqual({ key: 'netSalary', dir: 'desc' });
    const s2 = nextSort(s1, 'netSalary');
    expect(s2).toEqual({ key: 'netSalary', dir: 'asc' });
    expect(nextSort(s2, 'netSalary')).toBeNull();
    expect(nextSort(null, 'name').dir).toBe('asc');
    expect(nextSort({ key: 'name', dir: 'asc' }, 'netSalary').key).toBe('netSalary');
  });
  it('totalsOf cộng các khoản', () => {
    const t = totalsOf([{ allowance: 1, overtime: 2, deduction: 3, tax: 4 }, { allowance: 10, overtime: 0, deduction: 0 }]);
    expect(t).toEqual({ allowance: 11, overtime: 2, deduction: 3, tax: 4 });
  });
});

import { payrollSnapshot, shiftMonth } from './payrollUtils';

describe('payrollSnapshot / shiftMonth', () => {
  it('state: none / draft / locked', () => {
    expect(payrollSnapshot({ items: [], isLocked: false }).state).toBe('none');
    expect(payrollSnapshot({ items: [{ netSalary: 1 }], isLocked: false }).state).toBe('draft');
    expect(payrollSnapshot({ items: [{ netSalary: 1 }], isLocked: true }).state).toBe('locked');
  });
  it('tổng, trung bình và top 5 theo thực nhận giảm dần', () => {
    const items = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, netSalary: n * 10 }));
    const s = payrollSnapshot({ items, isLocked: false });
    expect(s.count).toBe(6);
    expect(s.totalNet).toBe(210);
    expect(s.avgNet).toBe(35);
    expect(s.top.map((p) => p.id)).toEqual([6, 5, 4, 3, 2]);
  });
  it('kỳ rỗng không ra NaN', () => {
    expect(payrollSnapshot({ items: [], isLocked: false })).toEqual({ state: 'none', count: 0, totalNet: 0, avgNet: 0, top: [] });
    expect(payrollSnapshot({}).count).toBe(0);
  });
  it('shiftMonth qua năm đúng', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-03', -15)).toBe('2024-12');
  });
});
