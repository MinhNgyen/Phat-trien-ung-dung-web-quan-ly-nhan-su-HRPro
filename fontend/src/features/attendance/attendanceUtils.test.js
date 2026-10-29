import { describe, it, expect } from 'vitest';
import { buildCheckinPayload, checkinDefaults, countByStatus, earlyMinutes, evaluate, metaOf } from './attendanceUtils';

const hc = { id: 1, startTime: '08:00', endTime: '17:00', graceMinutes: 10 };
const night = { id: 2, startTime: '22:00', endTime: '06:00', graceMinutes: 10 };

describe('earlyMinutes', () => {
  it('về sớm và đúng giờ', () => {
    expect(earlyMinutes(hc, '16:30')).toBe(30);
    expect(earlyMinutes(hc, '17:00')).toBe(0);
    expect(earlyMinutes(hc, null)).toBe(0);
  });
  it('ca đêm qua ngày', () => {
    expect(earlyMinutes(night, '05:00')).toBe(60);
    expect(earlyMinutes(night, '23:00')).toBe(420);
  });
});

describe('evaluate', () => {
  it('trong thời gian cho phép muộn là đúng giờ', () => { expect(evaluate(hc, 'work', '08:10', '17:00').status).toBe('PRESENT'); });
  it('quá thời gian cho phép là muộn', () => {
    const r = evaluate(hc, 'work', '08:25', '17:00');
    expect(r.status).toBe('LATE');
    expect(r.late).toBe(15);
    expect(r.reason).toBe('Đi muộn 15 phút');
  });
  it('về sớm cũng bị tính là LATE', () => { expect(evaluate(hc, 'work', '08:00', '16:00').reason).toBe('Về sớm 60 phút'); });
  it('nghỉ phép / vắng / thiếu dữ liệu', () => {
    expect(evaluate(hc, 'leave').status).toBe('LEAVE');
    expect(evaluate(hc, 'absent').status).toBe('ABSENT');
    expect(evaluate(null, 'work', '08:00').reason).toBe('Chưa phân ca');
    expect(evaluate(hc, 'work', '').reason).toBe('Chưa có giờ vào');
  });
});

describe('metaOf / countByStatus', () => {
  it('dùng lateMinutes backend trả về', () => {
    expect(metaOf({ status: 'LATE', lateMinutes: 20, checkOut: '17:00' }, hc).reason).toBe('Đi muộn 20 phút');
    expect(metaOf({ status: 'LEAVE' }, hc).reason).toBe('Nghỉ phép');
  });
  it('đếm theo trạng thái', () => {
    expect(countByStatus([{ status: 'LATE' }, { status: 'LATE' }, { status: 'PRESENT' }])).toEqual({ PRESENT: 1, LATE: 2, ABSENT: 0, LEAVE: 0 });
  });
});

describe('checkin', () => {
  it('buildCheckinPayload: đi làm cần giờ vào', () => {
    expect(buildCheckinPayload({ employeeId: 1, date: '2026-10-22', shiftId: 1, type: 'work', checkIn: '' }).error).toMatch(/giờ vào/);
    const { payload } = buildCheckinPayload({ employeeId: '1', date: '2026-10-22', shiftId: '1', type: 'work', checkIn: '08:00', checkOut: '', note: ' ' });
    expect(payload).toEqual({ employeeId: 1, shiftId: 1, date: '2026-10-22', type: 'NORMAL', note: null, checkIn: '08:00', checkOut: null });
  });
  it('buildCheckinPayload: nghỉ phép xóa giờ', () => {
    const { payload } = buildCheckinPayload({ employeeId: 1, date: 'd', shiftId: 1, type: 'leave', checkIn: '08:00' });
    expect(payload.status).toBe('LEAVE');
    expect(payload.checkIn).toBeNull();
  });
  it('checkinDefaults lấy giờ của ca đầu tiên', () => {
    expect(checkinDefaults({ shifts: [{ id: 1 }] }, [hc])).toEqual({ shiftId: 1, checkIn: '08:00', checkOut: '17:00' });
  });
});

import { selfCheckinState } from './attendanceUtils';

describe('selfCheckinState', () => {
  it('chưa có bản ghi -> none', () => { expect(selfCheckinState([]).state).toBe('none'); });
  it('đã vào chưa ra -> in', () => {
    const r = { checkIn: '08:00', checkOut: null };
    expect(selfCheckinState([r])).toEqual({ state: 'in', record: r });
  });
  it('đã vào và ra -> done (lấy bản ghi mới nhất); còn ca đang mở thì ưu tiên in', () => {
    const a = { checkIn: '08:00', checkOut: '12:00' }; const b = { checkIn: '13:00', checkOut: '17:00' }; const c = { checkIn: '18:00', checkOut: null };
    expect(selfCheckinState([a, b]).record).toBe(b);
    expect(selfCheckinState([a, c]).state).toBe('in');
  });
  it('nghỉ phép / vắng -> off', () => { expect(selfCheckinState([{ status: 'LEAVE' }]).state).toBe('off'); });
});
