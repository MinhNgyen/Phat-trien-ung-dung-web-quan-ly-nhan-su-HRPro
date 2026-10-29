'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useLateBadge } from '@/context/LateBadgeContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { downloadCSV } from '@/lib/csv';
import { todayStr } from '@/lib/format';
import AttendanceDetailModal from './AttendanceDetailModal';
import AttendanceStats from './AttendanceStats';
import AttendanceTable from './AttendanceTable';
import CheckinModal from './CheckinModal';
import { attendanceCsvRows, countByStatus } from './attendanceUtils';

/** Dữ liệu nạp THEO NGÀY đang xem (không tải toàn bộ lịch sử). */
export default function AttendancePage() {
  const { user } = useAuth();
  const { empById, shiftById } = useRefs();
  const { setLateToday } = useLateBadge();
  const { run } = useRun();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const seq = useRef(0); // chống ghi đè khi người dùng đổi ngày liên tục

  const load = useCallback(async () => {
    const mine = ++seq.current;
    await run(async () => {
      const data = user.role === 'employee' // nhân viên thường chỉ xem của chính mình
        ? (await attendanceApi.byEmployee(user.employeeId, date.slice(0, 7))).filter((r) => r.date === date)
        : await attendanceApi.byDate(date);
      if (mine !== seq.current) return; // đã có yêu cầu mới hơn
      setRows(data);
      if (date === todayStr()) setLateToday(data.filter((r) => r.status === 'LATE').length);
    }, 'Không tải được dữ liệu chấm công.');
  }, [date, user, run, setLateToday]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => countByStatus(rows), [rows]);

  function exportCsv() {
    const resolvers = {
      shiftOf: (r) => shiftById(r.shiftId) || r.shift,
      deptOf: (r) => (empById(r.employeeId) || r.employee).department,
    };
    downloadCSV(`cham_cong_${date}.csv`, attendanceCsvRows(date, rows, resolvers));
  }

  return (
    <div className="page active">
      <PageHeader title="Chấm công" subtitle="Dữ liệu chấm công thật theo ngày — trạng thái tính tự động từ giờ vào/ra và quy định ca">
        <input className="form-control" type="date" value={date} style={{ width: 160 }} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button type="button" className="btn btn-outline" onClick={exportCsv}>📤 Xuất CSV</button>
        <Can roles="admin,hr,manager"><button type="button" className="btn btn-primary" onClick={() => setCheckinOpen(true)}>✅ Chấm công thủ công</button></Can>
      </PageHeader>

      <AttendanceStats counts={counts} />

      <div className="card">
        <div className="card-header"><div className="card-title">Bảng chấm công ngày {date}</div></div>
        <AttendanceTable rows={rows} onDetail={setDetail} />
      </div>

      {checkinOpen && (
        <CheckinModal date={date} onClose={() => setCheckinOpen(false)}
          onSaved={(savedDate) => (savedDate === date ? load() : setDate(savedDate))} />
      )}
      {detail && <AttendanceDetailModal record={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
