'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import { todayStr } from '@/lib/format';
import { hasRole } from '@/lib/permissions';
import { useAuth } from './AuthContext';

/** Số bản ghi đi muộn hôm nay -> hiện ở huy hiệu trên menu "Chấm công". Trang Chấm công gọi setLateToday khi xem ngày hôm nay. */
const LateBadgeContext = createContext({ lateToday: 0, setLateToday: () => {} });

export function LateBadgeProvider({ children }) {
  const { user } = useAuth();
  const [lateToday, setLateToday] = useState(0);

  useEffect(() => {
    if (!hasRole(user, 'admin,hr,manager')) { setLateToday(0); return undefined; }
    let alive = true;
    attendanceApi.byDate(todayStr())
      .then((rows) => { if (alive) setLateToday(rows.filter((r) => r.status === 'LATE').length); })
      .catch(() => {}); // huy hiệu chỉ là phụ, lỗi thì bỏ qua
    return () => { alive = false; };
  }, [user]);

  const value = useMemo(() => ({ lateToday, setLateToday }), [lateToday]);
  return <LateBadgeContext.Provider value={value}>{children}</LateBadgeContext.Provider>;
}

export const useLateBadge = () => useContext(LateBadgeContext);
