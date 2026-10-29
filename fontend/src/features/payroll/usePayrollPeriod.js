'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { payrollApi } from '@/api/payroll';
import { useAuth } from '@/context/AuthContext';
import { useRun } from '@/hooks/useRun';
import { curMonth } from '@/lib/format';
import { loadPayrollForUser } from './loadPayroll';

/**
 * Nạp bảng lương 1 kỳ + các thao tác tính / chốt / mở khóa (dùng chung cho trang Tính lương và khu lương trên Dashboard).
 * onChanged() chạy sau mỗi thao tác thành công (để làm mới thông báo, số liệu...).
 */
export function usePayrollPeriod({ onChanged } = {}) {
  const { user, can } = useAuth();
  const { run, busy } = useRun();
  const [month, setMonth] = useState(curMonth());
  const [data, setData] = useState({ month: '', isLocked: false, items: [] });
  const seq = useRef(0);
  const canManage = can('admin,accountant');
  // đã chốt thì chỉ ADMIN được mở khóa
  const canToggleLock = canManage && !(data.isLocked && user.role !== 'admin');

  const load = useCallback(async () => {
    const mine = ++seq.current;
    await run(async () => {
      const d = await loadPayrollForUser(user, month);
      if (mine !== seq.current) return;
      setData(d);
    }, 'Không tải được bảng lương.');
  }, [month, user, run]);

  useEffect(() => { load(); }, [load]);

  const afterChange = useCallback(async () => { await load(); if (onChanged) onChanged(); }, [load, onChanged]);

  const calculate = useCallback(async () => {
    if (!canManage) return;
    if (data.isLocked) { alert(`Bảng lương kỳ ${month} đã chốt. Hãy mở khóa (Admin) trước khi tính lại.`); return; }
    if (!confirm(`Tính lương kỳ ${month} từ dữ liệu chấm công? Bảng lương đã tính trước đó của kỳ này sẽ được cập nhật lại.`)) return;
    const ok = await run(async () => { await payrollApi.calculate(month); return true; }, 'Không tính được lương.');
    if (ok) await afterChange();
  }, [canManage, data.isLocked, month, run, afterChange]);

  const toggleLock = useCallback(async () => {
    if (!canManage) return;
    if (!data.isLocked && !confirm(`Chốt bảng lương kỳ ${month}? Sau khi chốt, không thể tính lại hay sửa bảng lương.`)) return;
    const ok = await run(async () => {
      if (data.isLocked) await payrollApi.unlock(month); else await payrollApi.lock(month);
      return true;
    }, 'Không đổi được trạng thái chốt lương.');
    if (ok) await afterChange();
  }, [canManage, data.isLocked, month, run, afterChange]);

  return { month, setMonth, data, canManage, canToggleLock, busy, load, calculate, toggleLock };
}
