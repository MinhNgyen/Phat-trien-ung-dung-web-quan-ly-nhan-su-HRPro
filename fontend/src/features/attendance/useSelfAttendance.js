'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import { useAuth } from '@/context/AuthContext';
import { useRun } from '@/hooks/useRun';
import { todayStr } from '@/lib/format';
import { selfCheckinState } from './attendanceUtils';

/** Chấm công vào/ra cho CHÍNH MÌNH (tài khoản phải liên kết với 1 hồ sơ nhân viên). */
export function useSelfAttendance() {
  const { user } = useAuth();
  const { run, busy } = useRun();
  const employeeId = user ? user.employeeId : null;
  const [records, setRecords] = useState(null); // null = đang tải

  const load = useCallback(async () => {
    if (!employeeId) { setRecords([]); return; }
    const today = todayStr();
    try {
      const list = await attendanceApi.byEmployee(employeeId, today.slice(0, 7));
      setRecords(list.filter((r) => r.date === today));
    } catch (err) {
      if (err.status !== 401) setRecords([]);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const checkIn = useCallback(async (shiftId) => {
    const ok = await run(async () => { await attendanceApi.checkIn(employeeId, shiftId || undefined); return true; }, 'Không chấm công vào được.');
    if (ok) await load();
    return !!ok;
  }, [employeeId, run, load]);

  const checkOut = useCallback(async () => {
    const ok = await run(async () => { await attendanceApi.checkOut(employeeId); return true; }, 'Không chấm công ra được.');
    if (ok) await load();
    return !!ok;
  }, [employeeId, run, load]);

  const current = useMemo(() => (records ? selfCheckinState(records) : null), [records]);
  return { employeeId, records, current, checkIn, checkOut, busy };
}
