'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import DeptTag from '@/components/ui/DeptTag';
import EmpCell from '@/components/ui/EmpCell';
import { useRefs } from '@/context/RefsContext';
import { todayStr } from '@/lib/format';
import AttendanceDetailModal from '../attendance/AttendanceDetailModal';
import CheckinModal from '../attendance/CheckinModal';
import { metaOf, statusOf } from '../attendance/attendanceUtils';
import { attendanceBuckets } from './dashboardUtils';

const TABS = [['late', 'Đi muộn'], ['absent', 'Vắng'], ['missing', 'Chưa chấm công']];
const LIMIT = 6;

/** HR/Admin: xem ai đi muộn / vắng / chưa chấm công hôm nay, mở chi tiết hoặc chấm công hộ ngay tại Dashboard. */
export default function AttendanceTodayPanel({ rows, onChanged }) {
  const { emps, shiftById } = useRefs();
  const [tab, setTab] = useState('late');
  const [detail, setDetail] = useState(null);       // bản ghi đang xem chi tiết
  const [checkinFor, setCheckinFor] = useState(null); // id nhân viên đang được chấm công hộ
  const buckets = useMemo(() => attendanceBuckets(emps, rows), [emps, rows]);
  const list = buckets[tab];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Chấm công hôm nay</div>
        <Link href="/attendance" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }}>Mở trang chấm công</Link>
      </div>
      <div className="mini-tabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={'chip' + (tab === key ? ' active' : '')} onClick={() => setTab(key)}>
            {label} <span className="n">{buckets[key].length}</span>
          </button>
        ))}
      </div>

      <div className="panel-list">
        {list.length === 0 && <div className="panel-empty">🎉 Không có nhân viên nào trong mục này</div>}
        {tab === 'missing' && list.slice(0, LIMIT).map((e) => (
          <div className="panel-row" key={e.id}>
            <div className="grow"><EmpCell employee={e} sub={e.position || e.employeeCode} /></div>
            <DeptTag dept={e.department} />
            <button type="button" className="btn btn-primary" onClick={() => setCheckinFor(e.id)}>Chấm công hộ</button>
          </div>
        ))}
        {tab !== 'missing' && list.slice(0, LIMIT).map((r) => {
          const st = statusOf(r.status);
          const m = metaOf(r, shiftById(r.shiftId) || r.shift);
          return (
            <div className="panel-row" key={r.id}>
              <div className="grow"><EmpCell employee={r.employee} sub={`${r.checkIn || '—'} · ${m.reason}`} /></div>
              <span className={`badge ${st.cls}`}>{st.lbl}</span>
              <button type="button" className="btn btn-outline" onClick={() => setDetail(r)}>Chi tiết</button>
            </div>
          );
        })}
      </div>
      {list.length > LIMIT && <div className="panel-foot">+{list.length - LIMIT} nhân viên nữa — <Link href="/attendance">xem tất cả</Link></div>}

      {detail && <AttendanceDetailModal record={detail} onClose={() => setDetail(null)} />}
      {checkinFor && <CheckinModal date={todayStr()} employeeId={checkinFor} onClose={() => setCheckinFor(null)} onSaved={onChanged} />}
    </div>
  );
}
