'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants';
import { DEMO_ACCOUNTS } from './demoAccounts';

export default function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Đã có phiên hợp lệ -> vào thẳng ứng dụng
  useEffect(() => { if (!loading && user) router.replace('/dashboard'); }, [loading, user, router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Vui lòng nhập tên đăng nhập và mật khẩu.'); return; }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu.');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">⚡ HRPro</div>
        <div className="login-sub">Hệ thống quản lý nhân sự</div>
        <div className="form-group">
          <label className="form-label">Tên đăng nhập</label>
          <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="admin" autoComplete="username" />
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu</label>
          <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••" autoComplete="current-password" />
        </div>
        <div className="login-error">{error}</div>
        <button type="submit" className="btn btn-primary" disabled={submitting}
          style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <div className="login-hint">
          <strong>Tài khoản demo:</strong>
          {DEMO_ACCOUNTS.map(([u, p, r]) => <div key={u}>{u} / {p} — {ROLES[r].label}</div>)}
        </div>
      </form>
    </div>
  );
}
