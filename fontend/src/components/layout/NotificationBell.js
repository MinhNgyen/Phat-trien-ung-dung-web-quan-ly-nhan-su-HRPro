'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/context/NotificationsContext';

const fmtClock = (d) => (d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

export default function NotificationBell() {
  const { notifications, readIds, unreadCount, loading, updatedAt, markRead, markAllRead, dismiss, dismissAll, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const [ringing, setRinging] = useState(false);
  const ref = useRef(null);
  const prevUnread = useRef(0);

  // đóng khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // chuông rung khi xuất hiện thông báo chưa đọc MỚI (không rung ở lần nạp đầu tiên)
  useEffect(() => {
    if (updatedAt && unreadCount > prevUnread.current && prevUnread.current !== null) {
      setRinging(true);
      const t = setTimeout(() => setRinging(false), 1200);
      prevUnread.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnread.current = unreadCount;
    return undefined;
  }, [unreadCount, updatedAt]);

  const shown = tab === 'unread' ? notifications.filter((n) => !readIds.has(n.id)) : notifications;

  return (
    <div className="notif-wrap" ref={ref}>
      <button type="button" className={'btn btn-outline notif-btn' + (ringing ? ' ringing' : '')} title="Thông báo" onClick={() => setOpen((o) => !o)}>
        🔔{unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span>Thông báo</span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button type="button" onClick={refresh} title="Làm mới" className={loading ? 'spin' : ''}>↻</button>
              <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>Đã đọc tất cả</button>
            </span>
          </div>
          <div className="notif-tabs">
            <button type="button" className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Tất cả ({notifications.length})</button>
            <button type="button" className={tab === 'unread' ? 'active' : ''} onClick={() => setTab('unread')}>Chưa đọc ({unreadCount})</button>
          </div>
          {shown.length === 0 && <div className="notif-empty">{tab === 'unread' ? '✅ Bạn đã đọc hết thông báo' : '🎉 Không có thông báo nào'}</div>}
          {shown.map((n) => (
            <div key={n.id} className={'notif-row' + (readIds.has(n.id) ? '' : ' unread')}>
              <Link href={n.href} className="notif-item" onClick={() => { markRead(n.id); setOpen(false); }}>
                <div className={`notif-icon tone-${n.tone}`}>{n.icon}</div>
                <div><div className="notif-title">{n.title}</div><div className="notif-desc">{n.desc}</div></div>
              </Link>
              <button type="button" className="notif-x" title="Bỏ qua thông báo này" onClick={() => dismiss(n.id)}>×</button>
            </div>
          ))}
          <div className="notif-foot">
            <span>Cập nhật lúc {fmtClock(updatedAt)}</span>
            {notifications.length > 0 && <button type="button" onClick={dismissAll}>Bỏ qua tất cả</button>}
          </div>
        </div>
      )}
    </div>
  );
}
