'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth';
import { UNAUTHORIZED_EVENT } from '@/api/client';
import { hasRole } from '@/lib/permissions';

const AuthContext = createContext(null);

// user từ API (/auth/login hoặc /auth/me) -> dạng dùng trong UI (role viết thường: ADMIN -> admin)
export function normalizeUser(u) {
  return {
    userId: u.id,
    username: u.username,
    name: u.fullName || u.username,
    role: String(u.role || '').toLowerCase(),
    employeeId: u.employee ? u.employee.id : null,
    employeeCode: u.employee ? u.employee.employeeCode : null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // đang khôi phục phiên (F5 không phải đăng nhập lại)

  useEffect(() => {
    let alive = true;
    (async () => {
      if (authApi.hasToken()) {
        try { const u = await authApi.me(); if (alive) setUser(normalizeUser(u)); }
        catch (err) { console.warn('Phiên đăng nhập cũ không còn hiệu lực', err); }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // api/client.js phát sự kiện này khi gặp 401
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    const u = normalizeUser(data.user);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => { authApi.logout(); setUser(null); }, []);
  const can = useCallback((roles) => hasRole(user, roles), [user]);

  const value = useMemo(() => ({ user, loading, login, logout, can }), [user, loading, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
};
