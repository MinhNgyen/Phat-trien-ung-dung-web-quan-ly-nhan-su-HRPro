'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { canOpen } from '@/lib/permissions';
import { fmt, fmtScore } from '@/lib/format';
import { attendanceStat, payrollStat } from './dashboardUtils';

// Mỗi thẻ là đường tắt tới trang liên quan (nếu vai trò có quyền mở trang đó)
function Card({ href, icon, bg, value, label, change, changeClass, changeStyle }) {
  const { user } = useAuth();
  const body = (
    <>
      <div className="stat-icon" style={{ background: bg }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-change ${changeClass || ''}`} style={changeStyle}>{change}</div>
    </>
  );
  return canOpen(user, href)
    ? <Link href={href} className="stat-card is-link">{body}<span className="go">→</span></Link>
    : <div className="stat-card">{body}</div>;
}

export default function DashboardStats({ dash, baseSalarySum, avgKpi }) {
  const att = dash ? attendanceStat(dash) : null;
  const pay = dash ? payrollStat(dash, baseSalarySum) : null;
  const muted = { color: 'var(--text-muted)' };
  return (
    <div className="stats-grid">
      <Card href="/employees" icon="👥" bg="#eff6ff" value={dash ? dash.totalEmployees : '—'} label="Tổng nhân viên"
        change={dash ? `${dash.activeEmployees} đang làm việc` : '—'} changeClass="up" />
      <Card href="/attendance" icon="✅" bg="#f0fdf4" value={att ? `${att.percent}%` : '—'} label="Tỷ lệ đi làm hôm nay"
        change={att ? `${att.present}/${dash.totalEmployees} có mặt` : '—'} changeStyle={muted} />
      <Card href="/salary" icon="💰" bg="#fffbeb" value={pay ? fmt(pay.value) : '—'} label="Tổng quỹ lương / tháng"
        change={pay ? pay.sub : '—'} changeStyle={muted} />
      <Card href="/performance" icon="🎯" bg="#fdf2f8" value={avgKpi == null ? '—' : fmtScore(avgKpi)} label="KPI trung bình"
        change="Kỳ hiện tại" changeClass="up" />
    </div>
  );
}
