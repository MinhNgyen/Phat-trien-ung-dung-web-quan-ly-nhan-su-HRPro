'use client';
import { useState } from 'react';
import { attendanceApi } from '@/api/attendance';
import Modal from '@/components/ui/Modal';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { buildCheckinPayload, checkinDefaults, evaluate, shiftOptionsFor, statusOf } from './attendanceUtils';

/** Chấm công thủ công (employeeId tùy chọn để chọn sẵn nhân viên). Nếu đã có bản ghi cùng nhân viên + ca + ngày (409) thì cập nhật bản ghi đó. */
export default function CheckinModal({ date, employeeId, onClose, onSaved }) {
  const { emps, shifts, empById, shiftById } = useRefs();
  const { run, busy } = useRun();
  const [form, setForm] = useState(() => {
    const first = (employeeId && empById(employeeId)) || emps[0]; // employeeId: mở sẵn cho 1 nhân viên (chấm công hộ)
    return { employeeId: first ? first.id : '', date, type: 'work', note: '', ...checkinDefaults(first, shifts) };
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const emp = empById(form.employeeId);
  const shiftList = shiftOptionsFor(emp, shifts);
  const shift = shiftById(form.shiftId);
  const ev = evaluate(shift, form.type, form.checkIn, form.checkOut);
  const st = statusOf(ev.status);

  const changeEmployee = (e) => {
    const next = empById(e.target.value);
    setForm((f) => ({ ...f, employeeId: e.target.value, ...checkinDefaults(next, shifts) }));
  };
  const changeShift = (e) => {
    const s = shiftById(e.target.value);
    setForm((f) => ({ ...f, shiftId: e.target.value, ...(s ? { checkIn: s.startTime, checkOut: s.endTime } : {}) }));
  };

  async function save() {
    const { payload, error } = buildCheckinPayload(form);
    if (error) { alert(error); return; }
    const ok = await run(async () => {
      try {
        await attendanceApi.create(payload);
      } catch (err) {
        if (err.status !== 409) throw err;
        const existing = (await attendanceApi.byDate(payload.date))
          .find((r) => r.employeeId === payload.employeeId && (r.shiftId || null) === payload.shiftId);
        if (!existing) throw err;
        await attendanceApi.update(existing.id, payload);
      }
      return true;
    }, 'Không lưu được chấm công.');
    if (ok) { onSaved(payload.date); onClose(); }
  }

  return (
    <Modal
      title="✅ Chấm công thủ công"
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-success" onClick={save} disabled={busy}>✓ Lưu chấm công</button>
      </>}
    >
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Nhân viên *</label>
          <select className="form-control" value={form.employeeId} onChange={changeEmployee}>
            {emps.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} – {e.name}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Ngày *</label>
          <input className="form-control" type="date" value={form.date} onChange={set('date')} /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Ca áp dụng *</label>
          <select className="form-control" value={form.shiftId} onChange={changeShift}>
            {shiftList.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Loại</label>
          <select className="form-control" value={form.type} onChange={set('type')}>
            <option value="work">Đi làm (tính theo giờ vào/ra)</option>
            <option value="leave">Nghỉ phép</option>
            <option value="absent">Vắng không phép</option>
          </select></div>
      </div>
      {form.type === 'work' && (
        <div className="form-grid-2">
          <div className="form-group"><label className="form-label">Giờ vào</label>
            <input className="form-control" type="time" value={form.checkIn} onChange={set('checkIn')} /></div>
          <div className="form-group"><label className="form-label">Giờ ra</label>
            <input className="form-control" type="time" value={form.checkOut} onChange={set('checkOut')} /></div>
        </div>
      )}
      <div className="form-group"><label className="form-label">Ghi chú</label>
        <input className="form-control" value={form.note} onChange={set('note')} placeholder="Lý do..." /></div>
      <div className="ci-preview">
        Kết quả dự kiến: <span className={`badge ${st.cls}`}>{st.lbl}</span> · <strong>{shift ? shift.name : 'Chưa phân ca'}</strong>
        <br /><span style={{ color: 'var(--text-muted)' }}>{ev.reason}</span>
      </div>
    </Modal>
  );
}
