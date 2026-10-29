'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV, ROLES } from '@/lib/constants';
import { hasRole } from '@/lib/permissions';
import { initials } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useLateBadge } from '@/context/LateBadgeContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { lateToday } = useLateBadge();
  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav id="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">⚡ HRPro</div>
        <div className="logo-sub">Quản lý Nhân sự</div>
      </div>

      {NAV.filter((s) => hasRole(user, s.roles)).map((section) => (
        <div key={section.section}>
          <div className="nav-section">{section.section}</div>
          {section.items.filter((i) => hasRole(user, i.roles)).map((item) => (
            <Link key={item.href} href={item.href} className={'nav-item' + (isActive(item.href) ? ' active' : '')}>
              <span className="icon">{item.icon}</span> {item.label}
              {item.href === '/attendance' && lateToday > 0 && <span className="nbadge">{lateToday}</span>}
            </Link>
          ))}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div className="user-info">
          <div className="user-avatar">{initials(user.name)}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{(ROLES[user.role] || {}).label || user.role}</div>
          </div>
        </div>
        <button type="button" className="btn btn-outline logout-btn" onClick={logout}>↩ Đăng xuất</button>
      </div>
    </nav>
  );
}
