'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth';
import { useRun } from '@/hooks/useRun';
import { ROLES } from '@/lib/constants';
import { countByRole } from './dashboardUtils';

const ROLE_KEYS = Object.keys(ROLES);

/** Admin: số tài khoản theo vai trò; bấm vào một vai trò để xem danh sách tài khoản. */
export default function AccountsPanel() {
  const { run } = useRun();
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    let alive = true;
    run(async () => { const list = await authApi.users(); if (alive) setUsers(list); }, 'Không tải được danh sách tài khoản.');
    return () => { alive = false; };
  }, [run]);

  const counts = useMemo(() => countByRole(users || [], ROLE_KEYS), [users]);
  const shown = (users || []).filter((u) => String(u.role).toLowerCase() === role);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Tài khoản & phân quyền</div>
        <Link href="/settings" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }}>Cài đặt</Link>
      </div>
      <div className="mini-tabs">
        {counts.map((c) => (
          <button key={c.role} type="button" className={'chip' + (role === c.role ? ' active' : '')} onClick={() => setRole((cur) => (cur === c.role ? '' : c.role))}>
            {ROLES[c.role].label} <span className="n">{c.count}</span>
          </button>
        ))}
      </div>
      <div className="panel-list">
        {users == null && <div className="panel-empty">Đang tải...</div>}
        {users != null && !role && <div className="panel-empty">Bấm vào một vai trò để xem tài khoản<br />({users.length} tài khoản trong hệ thống)</div>}
        {role && shown.length === 0 && <div className="panel-empty">Chưa có tài khoản nào</div>}
        {shown.map((u) => (
          <div className="panel-row" key={u.id || u.username}>
            <div className="grow"><strong>{u.username}</strong><div className="emp-sub">{u.fullName || ''}</div></div>
            <span className="badge badge-info">{ROLES[role].scope}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
