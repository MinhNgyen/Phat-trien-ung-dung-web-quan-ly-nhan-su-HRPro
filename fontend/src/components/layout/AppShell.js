'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { findNavItem, firstAllowedHref, hasRole } from '@/lib/permissions';
import Sidebar from './Sidebar';
import Header from './Header';

const Loading = () => <div className="full-loading">Đang tải...</div>;

/** Khung sau đăng nhập: chặn người chưa đăng nhập / sai quyền, rồi vẽ sidebar + header + nội dung trang. */
export default function AppShell({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: refsLoading, error, reload } = useRefs();
  const router = useRouter();
  const pathname = usePathname();

  const item = findNavItem(pathname);
  const allowed = !item || hasRole(user, item.roles);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/login');
    else if (!allowed) router.replace(firstAllowedHref(user));
  }, [authLoading, user, allowed, router]);

  if (authLoading || !user || !allowed) return <Loading />;

  return (
    <div id="app-shell">
      <Sidebar />
      <div id="main">
        <Header />
        <div id="page-content" className={refsLoading ? 'is-loading' : ''}>
          {error ? (
            <div className="card"><div className="card-body">
              <p style={{ color: 'var(--danger)' }}>{error}</p>
              <button type="button" className="btn btn-primary" onClick={reload}>Thử lại</button>
            </div></div>
          ) : children}
        </div>
      </div>
    </div>
  );
}
