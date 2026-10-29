'use client';
import { useState } from 'react';
import { employeesApi } from '@/api/employees';
import Modal from '@/components/ui/Modal';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { emptyForm, formFromEmployee, planShiftSync, toPayload, validateEmployee } from './employeeUtils';

/** Modal thêm (employee = null) / sửa nhân viên. Cha render có điều kiện nên state form tự reset mỗi lần mở. */
export default function EmployeeFormModal({ employee, onClose }) {
  const { depts, shifts, emps, reload } = useRefs();
  const { run, busy } = useRun();
  const [form, setForm] = useState(() => (employee ? formFromEmployee(employee) : emptyForm(emps, shifts)));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setShifts = (e) => setForm((f) => ({ ...f, shiftIds: [...e.target.selectedOptions].map((o) => Number(o.value)) }));

  async function save() {
    const err = validateEmployee(form, emps, employee ? employee.id : null);
    if (err) { alert(err); return; }
    const payload = toPayload(form);
    const ok = await run(async () => {
      let id;
      if (employee) { id = employee.id; await employeesApi.update(id, payload); }
      else { id = (await employeesApi.create(payload)).id; }
      const { toRemove, toAdd } = planShiftSync(await employeesApi.getShifts(id), form.shiftIds);
      for (const sid of toRemove) await employeesApi.unassignShift(id, sid);
      for (const a of toAdd) await employeesApi.assignShift(id, a.shiftId, a.isPrimary);
      await reload();
      return true;
    }, 'Không lưu được nhân viên.');
    if (ok) onClose();
  }

  return (
    <Modal
      title={employee ? '✏️ Sửa thông tin nhân viên' : '👤 Thêm nhân viên mới'}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>✓ Lưu & Cập nhật</button>
      </>}
    >
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Họ và tên *</label>
          <input className="form-control" value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" /></div>
        <div className="form-group"><label className="form-label">Mã nhân viên *</label>
          <input className="form-control" value={form.code} onChange={set('code')} readOnly={!!employee} placeholder="NV026" /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Email</label>
          <input className="form-control" type="email" value={form.email} onChange={set('email')} /></div>
        <div className="form-group"><label className="form-label">Điện thoại</label>
          <input className="form-control" value={form.phone} onChange={set('phone')} /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Phòng ban *</label>
          <select className="form-control" value={form.deptId} onChange={set('deptId')}>
            <option value="">— Chọn phòng ban —</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Chức vụ</label>
          <input className="form-control" value={form.position} onChange={set('position')} placeholder="Developer" /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Ngày vào làm</label>
          <input className="form-control" type="date" value={form.joinedAt} onChange={set('joinedAt')} /></div>
        <div className="form-group"><label className="form-label">Lương cơ bản (VNĐ) *</label>
          <input className="form-control" type="number" min="1000000" value={form.salary} onChange={set('salary')} placeholder="15000000" /></div>
      </div>
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Ca làm việc *</label>
          <select className="form-control multi-select" multiple size={4} value={form.shiftIds.map(String)} onChange={setShifts}>
            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
          </select>
          <div className="form-help">Giữ Ctrl/⌘ để chọn nhiều ca.</div></div>
        <div className="form-group"><label className="form-label">Trạng thái</label>
          <select className="form-control" value={form.status} onChange={set('status')}>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="LEAVE">Nghỉ phép</option>
            <option value="INACTIVE">Đã nghỉ việc</option>
          </select></div>
      </div>
    </Modal>
  );
}
