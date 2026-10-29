'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { findNavItem } from '@/lib/permissions';
import Can from '@/components/Can';
import NotificationBell from './NotificationBell';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const title = (findNavItem(pathname) || {}).title || 'HRPro';

  // Tìm kiếm nhanh: chuyển sang trang Nhân viên kèm ?q=... (trang đó đọc q để lọc)
  const onSearch = (value) => {
    setQ(value);
    router.replace(`/employees?q=${encodeURIComponent(value)}`);
  };

  return (
    <header>
      <div className="header-title">{title}</div>
      <Can roles="admin,hr,manager">
        <div className="header-search">
          <span>🔍</span>
          <input type="text" value={q} placeholder="Tìm kiếm nhân viên..." onChange={(e) => onSearch(e.target.value)} />
        </div>
      </Can>
      <div className="header-actions">
        <NotificationBell />
      </div>
    </header>
  );
}
