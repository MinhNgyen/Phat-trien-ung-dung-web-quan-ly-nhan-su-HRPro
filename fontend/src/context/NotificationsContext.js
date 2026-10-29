'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import { kpiApi } from '@/api/kpi';
import { loadPayrollForUser } from '@/features/payroll/loadPayroll';
import { buildNotifications, unreadOf, visibleOf } from '@/features/notifications/notificationUtils';
import { curMonth, todayStr } from '@/lib/format';
import { hasRole } from '@/lib/permissions';
import { useAuth } from './AuthContext';
import { useRefs } from './RefsContext';

const NotificationsContext = createContext({
  notifications: [], readIds: new Set(), unreadCount: 0, loading: false, updatedAt: null,
  markRead() {}, markAllRead() {}, dismiss() {}, dismissAll() {}, refresh() {},
});
const POLL_MS = 60000;
const key = (name, user) => `hrpro_notif_${name}:${user.userId}`;

// Bộ nhớ trình duyệt theo từng tài khoản: 'read' = đã đọc, 'dismissed' = đã bỏ qua
const loadSet = (name, user) => {
  try { return new Set(JSON.parse(localStorage.getItem(key(name, user)) || '[]')); } catch (e) { return new Set(); }
};
const saveSet = (name, user, set) => {
  try { localStorage.setItem(key(name, user), JSON.stringify([...set].slice(-300))); } catch (e) { /* bỏ qua */ }
};

/** Nạp dữ liệu thông báo (mỗi 60 giây + khi gọi refresh()); mỗi nguồn lỗi/không đủ quyền thì bỏ qua riêng nguồn đó. */
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { emps, kpiCur } = useRefs();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    setReadIds(user ? loadSet('read', user) : new Set());
    setDismissed(user ? loadSet('dismissed', user) : new Set());
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = todayStr(); const month = curMonth();
    const safe = (p) => p.catch(() => null);
    const canAtt = hasRole(user, 'admin,hr,manager');
    const canPay = hasRole(user, 'admin,accountant,employee');
    setLoading(true);
    try {
      const [rows, ownAtt, ownKpiList, payroll] = await Promise.all([
        canAtt ? safe(attendanceApi.byDate(today)) : null,
        user.employeeId ? safe(attendanceApi.byEmployee(user.employeeId, month)) : null,
        user.employeeId ? safe(kpiApi.byEmployee(user.employeeId)) : null,
        canPay ? safe(loadPayrollForUser(user, month)) : null,
      ]);
      setRaw({
        today, month,
        late: rows ? rows.filter((r) => r.status === 'LATE').length : 0,
        absent: rows ? rows.filter((r) => r.status === 'ABSENT').length : 0,
        checkedIds: rows ? rows.map((r) => r.employeeId) : null,
        ownToday: ownAtt ? ownAtt.filter((r) => r.date === today) : null,
        ownKpi: ownKpiList ? (ownKpiList.find((k) => k.period === month) || null) : null,
        payroll,
      });
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setRaw(null); return undefined; }
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [user, refresh]);

  const all = useMemo(() => {
    if (!raw || !user) return [];
    const manage = hasRole(user, 'admin,hr,manager');
    const active = emps.filter((e) => e.status === 'ACTIVE');
    const checked = raw.checkedIds ? new Set(raw.checkedIds) : null;
    const now = new Date();
    return buildNotifications({
      ...raw, user, hour: now.getHours(), dayOfMonth: now.getDate(),
      missingKpi: manage ? active.filter((e) => kpiCur[e.id] == null).length : 0,
      notCheckedIn: manage && checked ? active.filter((e) => !checked.has(e.id)).length : 0,
    });
  }, [raw, user, emps, kpiCur]);

  const notifications = useMemo(() => visibleOf(all, dismissed), [all, dismissed]);

  const addTo = useCallback((name, setter, ids) => {
    setter((prev) => { const next = new Set([...prev, ...ids]); if (user) saveSet(name, user, next); return next; });
  }, [user]);
  const markRead = useCallback((id) => addTo('read', setReadIds, [id]), [addTo]);
  const markAllRead = useCallback(() => addTo('read', setReadIds, notifications.map((n) => n.id)), [addTo, notifications]);
  const dismiss = useCallback((id) => addTo('dismissed', setDismissed, [id]), [addTo]);
  const dismissAll = useCallback(() => addTo('dismissed', setDismissed, notifications.map((n) => n.id)), [addTo, notifications]);

  const value = useMemo(() => ({
    notifications, readIds, loading, updatedAt, unreadCount: unreadOf(notifications, readIds).length,
    markRead, markAllRead, dismiss, dismissAll, refresh,
  }), [notifications, readIds, loading, updatedAt, markRead, markAllRead, dismiss, dismissAll, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
