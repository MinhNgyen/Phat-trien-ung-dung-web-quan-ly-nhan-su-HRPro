'use client';
import { useState } from 'react';
import { shiftsApi } from '@/api/shifts';
import Modal from '@/components/ui/Modal';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { emptyShiftForm, formFromShift, toShiftPayload, validateShift } from './shiftUtils';

/** Modal thêm (shift = null) / sửa ca làm việc. */
export default function ShiftFormModal({ shift, onClose }) {
  const { shifts, reload } = useRefs();
  const { run, busy } = useRun();
  const [form, setForm] = useState(() => (shift ? formFromShift(shift) : emptyShiftForm()));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    const err = validateShift(form, shifts, shift ? shift.id : null);
    if (err) { alert(err); return; }
    const payload = toShiftPayload(form);
    const ok = await run(async () => {
      if (shift) await shiftsApi.update(shift.id, payload); else await shiftsApi.create(payload);
      await reload();
      return true;
    }, 'Không lưu được ca làm việc.');
    if (ok) onClose();
  }

  return (
    <Modal
      title={shift ? '✏️ Sửa ca làm việc' : '📅 Thêm ca làm việc'}
      width={480}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>✓ Lưu</button>
      </>}
    >
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Mã ca *</label>
          <input className="form-control" value={form.code} onChange={set('code')} readOnly={!!shift} placeholder="HC" /></div>
        <div className="form-group"><label className="form-label">Tên ca *</label>
          <input className="form-control" value={form.name} onChange={set('name')} placeholder="Hành chính" /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Giờ vào *</label>
          <input className="form-control" type="time" value={form.startTime} onChange={set('startTime')} /></div>
        <div className="form-group"><label className="form-label">Giờ ra *</label>
          <input className="form-control" type="time" value={form.endTime} onChange={set('endTime')} /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Cho phép muộn (phút)</label>
          <input className="form-control" type="number" value={form.graceMinutes} onChange={set('graceMinutes')} /></div>
        <div className="form-group"><label className="form-label">Hệ số OT</label>
          <input className="form-control" type="number" step="0.1" value={form.overtimeRate} onChange={set('overtimeRate')} /></div>
      </div>
    </Modal>
  );
}
