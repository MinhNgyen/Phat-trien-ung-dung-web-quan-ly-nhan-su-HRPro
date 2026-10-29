'use client';
import { useState } from 'react';
import { departmentsApi } from '@/api/departments';
import Modal from '@/components/ui/Modal';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { emptyDeptForm, formFromDept, toDeptPayload, validateDepartment } from './departmentUtils';

/** Modal thêm (dept = null) / sửa phòng ban. */
export default function DepartmentFormModal({ dept, onClose }) {
  const { depts, emps, reload } = useRefs();
  const { run, busy } = useRun();
  const [form, setForm] = useState(() => (dept ? formFromDept(dept) : emptyDeptForm()));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    const err = validateDepartment(form, depts, dept ? dept.id : null);
    if (err) { alert(err); return; }
    const payload = toDeptPayload(form);
    const ok = await run(async () => {
      if (dept) await departmentsApi.update(dept.id, payload);
      else await departmentsApi.create(payload);
      await reload();
      return true;
    }, 'Không lưu được phòng ban.');
    if (ok) onClose();
  }

  return (
    <Modal
      title={dept ? '✏️ Sửa phòng ban' : '🏢 Thêm phòng ban'}
      width={480}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>✓ Lưu</button>
      </>}
    >
      <div className="form-grid-2">
        <div className="form-group"><label className="form-label">Mã phòng ban *</label>
          <input className="form-control" value={form.code} onChange={set('code')} readOnly={!!dept} placeholder="KT" /></div>
        <div className="form-group"><label className="form-label">Tên phòng ban *</label>
          <input className="form-control" value={form.name} onChange={set('name')} placeholder="Kỹ thuật" /></div>
      </div>
      <div className="form-group"><label className="form-label">Trưởng phòng</label>
        <select className="form-control" value={form.head} onChange={set('head')}>
          <option value="">—</option>
          {emps.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
        </select></div>
      <div className="form-group"><label className="form-label">Mô tả</label>
        <input className="form-control" value={form.description} onChange={set('description')} placeholder="Mô tả chức năng phòng ban" /></div>
      <div className="form-group"><label className="form-label">Màu hiển thị</label>
        <input className="form-control" type="color" value={form.color} onChange={set('color')} style={{ height: 42, padding: 4 }} /></div>
    </Modal>
  );
}
