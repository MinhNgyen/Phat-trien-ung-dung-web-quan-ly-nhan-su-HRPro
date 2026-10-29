import { describe, it, expect } from 'vitest';
import { buildNotifications, unreadOf } from './notificationUtils';

const base = { user: { employeeId: 7 }, today: '2026-10-27', month: '2026-10' };
const ids = (list) => list.map((n) => n.id);

describe('buildNotifications', () => {
  it('không có gì để báo -> rỗng', () => {
    expect(buildNotifications({ ...base, ownToday: [{ id: 1 }] })).toEqual([]);
  });
  it('nhắc chưa chấm công khi hôm nay chưa có bản ghi; chưa nạp được (null) thì không nhắc', () => {
    expect(ids(buildNotifications({ ...base, ownToday: [] }))).toEqual(['checkin:2026-10-27']);
    expect(buildNotifications({ ...base, ownToday: null })).toEqual([]);
    expect(buildNotifications({ user: { employeeId: null }, today: 'd', month: 'm', ownToday: [] })).toEqual([]);
  });
  it('đi muộn / vắng: id chứa số lượng nên số đổi thì thành thông báo mới', () => {
    const a = buildNotifications({ ...base, late: 2, absent: 1 });
    expect(ids(a)).toEqual(['late:2026-10-27:2', 'absent:2026-10-27:1']);
    expect(ids(buildNotifications({ ...base, late: 3 }))[0]).toBe('late:2026-10-27:3');
  });
  it('nhắc KPI chưa chấm, KPI của mình có xếp loại', () => {
    const l = buildNotifications({ ...base, missingKpi: 4, ownKpi: { id: 9, period: '2026-10', total: 92 } });
    expect(l[0].title).toMatch(/4 nhân viên chưa được chấm KPI/);
    expect(l[1].title).toMatch(/92/);
    expect(l[1].desc).toMatch(/Xuất sắc/);
  });
  it('bảng lương: đã tính vs đã chốt; rỗng thì không báo', () => {
    expect(ids(buildNotifications({ ...base, payroll: { items: [{}], isLocked: false } }))).toEqual(['payroll:2026-10']);
    expect(ids(buildNotifications({ ...base, payroll: { items: [{}], isLocked: true } }))).toEqual(['payroll-locked:2026-10']);
    expect(buildNotifications({ ...base, payroll: { items: [], isLocked: false } })).toEqual([]);
  });
  it('unreadOf bỏ các id đã đọc', () => {
    const l = buildNotifications({ ...base, late: 1, absent: 1 });
    expect(ids(unreadOf(l, new Set(['late:2026-10-27:1'])))).toEqual(['absent:2026-10-27:1']);
  });
});

import { visibleOf } from './notificationUtils';

describe('thông báo theo vai trò & độ ưu tiên', () => {
  const acc = { ...base, user: { role: 'accountant', employeeId: null } };
  it('kế toán: đã tính chưa chốt là việc cần làm; nhân viên chỉ là thông tin', () => {
    const pending = buildNotifications({ ...acc, payroll: { items: [{}], isLocked: false } });
    expect(ids(pending)).toEqual(['payroll-pending:2026-10']);
    expect(pending[0].tone).toBe('warning');
    const emp = buildNotifications({ ...base, user: { role: 'employee', employeeId: 7 }, ownToday: [{}], payroll: { items: [{}], isLocked: false } });
    expect(ids(emp)).toEqual(['payroll:2026-10']);
  });
  it('kế toán: từ ngày 20 mà chưa tính lương thì nhắc; trước ngày 20 thì im', () => {
    const empty = { items: [], isLocked: false };
    expect(ids(buildNotifications({ ...acc, payroll: empty, dayOfMonth: 25 }))).toEqual(['payroll-missing:2026-10']);
    expect(buildNotifications({ ...acc, payroll: empty, dayOfMonth: 10 })).toEqual([]);
    expect(buildNotifications({ ...base, user: { role: 'hr', employeeId: null }, payroll: empty, dayOfMonth: 25 })).toEqual([]);
  });
  it('chưa chấm công chỉ báo sau 9h', () => {
    expect(buildNotifications({ ...base, notCheckedIn: 3, hour: 8 })).toEqual([]);
    expect(ids(buildNotifications({ ...base, notCheckedIn: 3, hour: 9 }))).toEqual(['not-checked-in:2026-10-27:3']);
  });
  it('xếp theo độ ưu tiên: việc gấp lên đầu, thông tin xuống cuối', () => {
    const l = buildNotifications({
      ...acc, user: { role: 'admin', employeeId: 7 }, ownToday: [], late: 1, absent: 1, notCheckedIn: 2, hour: 10, missingKpi: 5,
      ownKpi: { id: 1, period: '2026-10', total: 80 }, payroll: { items: [{}], isLocked: true },
    });
    expect(ids(l)).toEqual(['checkin:2026-10-27', 'late:2026-10-27:1', 'absent:2026-10-27:1', 'not-checked-in:2026-10-27:2', 'kpi-missing:2026-10:5', 'kpi:1:80', 'payroll-locked:2026-10']);
  });
  it('visibleOf bỏ thông báo đã bị bỏ qua (dismiss)', () => {
    const l = buildNotifications({ ...base, late: 1, absent: 2 });
    expect(ids(visibleOf(l, new Set(['late:2026-10-27:1'])))).toEqual(['absent:2026-10-27:2']);
  });
});
