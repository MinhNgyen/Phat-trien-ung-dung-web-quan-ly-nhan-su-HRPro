'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { departmentsApi } from '@/api/departments';
import { shiftsApi } from '@/api/shifts';
import { employeesApi } from '@/api/employees';
import { kpiApi } from '@/api/kpi';
import { curMonth } from '@/lib/format';
import { hasRole } from '@/lib/permissions';
import { useAuth } from './AuthContext';

/**
 * Cache dữ liệu danh mục dùng chung nhiều trang (thay cho HR.state + HR.loadRefs() cũ):
 * phòng ban, ca, nhân viên, KPI kỳ hiện tại. Gọi reload() sau mỗi lần thêm/sửa/xóa.
 * Nhân viên thường không có quyền xem danh sách -> chỉ nạp hồ sơ của chính mình.
 */
const RefsContext = createContext(null);
const EMPTY = { depts: [], shifts: [], emps: [], kpiCur: {} };

export function RefsProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const canList = hasRole(user, 'admin,hr,accountant,manager');
      const [depts, shifts, empData, kpiList] = await Promise.all([
        departmentsApi.list(),
        shiftsApi.list(),
        canList ? employeesApi.list({ limit: 500 }) : Promise.resolve(null),
        canList ? kpiApi.list({ period: curMonth() }).catch(() => []) : Promise.resolve([]),
      ]);
      const kpiCur = {};
      kpiList.forEach((k) => { kpiCur[k.employeeId] = k.total; });
      const emps = canList ? empData.items
        : (user.employeeId ? [await employeesApi.get(user.employeeId)] : []);
      setData({ depts, shifts, emps, kpiCur });
    } catch (err) {
      if (err.status !== 401) setError(err.message || 'Không tải được dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) reload(); else setData(EMPTY);
  }, [user, reload]);

  const value = useMemo(() => ({
    ...data, loading, error, reload,
    empById: (id) => data.emps.find((e) => e.id === Number(id)),
    deptById: (id) => data.depts.find((d) => d.id === Number(id)),
    shiftById: (id) => data.shifts.find((s) => s.id === Number(id)),
    // Màu hiển thị của 1 phòng ban (dept có thể chỉ có id + name)
    deptColor: (dept) => (dept && (dept.color || (data.depts.find((d) => d.id === dept.id) || {}).color)) || '#94a3b8',
  }), [data, loading, error, reload]);

  return <RefsContext.Provider value={value}>{children}</RefsContext.Provider>;
}

export const useRefs = () => {
  const ctx = useContext(RefsContext);
  if (!ctx) throw new Error('useRefs phải dùng bên trong <RefsProvider>');
  return ctx;
};
