import { ROLES } from '@/lib/constants';

export default function UsersTable({ users }) {
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <div className="card-title">Tài khoản & phân quyền</div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chỉ Admin xem được</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>Phạm vi</th></tr></thead>
          <tbody>
            {users.map((u) => {
              const r = ROLES[String(u.role).toLowerCase()] || { label: u.role, scope: '' };
              return (
                <tr key={u.id || u.username}>
                  <td><strong>{u.username}</strong></td><td>{u.fullName || ''}</td>
                  <td><span className="badge badge-info">{r.label}</span></td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.scope}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
