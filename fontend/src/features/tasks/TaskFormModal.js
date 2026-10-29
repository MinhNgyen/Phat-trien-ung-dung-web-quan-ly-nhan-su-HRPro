'use client';
import { useState } from 'react';
import { tasksApi } from '@/api/tasks';
import Modal from '@/components/ui/Modal';
import { useRun } from '@/hooks/useRun';
import { todayStr } from '@/lib/format';
import { emptyTaskForm, formFromTask, toTaskPayload, validateTask, WEIGHT_LABELS } from './taskUtils';

/** Giao việc mới (task = null) hoặc sửa việc đang mở. */
export default function TaskFormModal({ task, employees, defaultEmployeeId, onClose, onSaved }) {
  const { run, busy } = useRun();
  const [form, setForm] = useState(() => (task ? formFromTask(task) : emptyTaskForm(defaultEmployeeId, todayStr())));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    const err = validateTask(form);
    if (err) { alert(err); return; }
    const ok = await run(async () => {
      const payload = toTaskPayload(form);
      if (task) await tasksApi.update(task.id, payload);
      else await tasksApi.create(payload);
      return true;
    }, 'Không lưu được đầu việc.');
    if (ok) { onSaved(); onClose(); }
  }

  return (
    <Modal
      title={task ? '✏️ Sửa đầu việc' : '📋 Giao việc'}
      width={520}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>✓ {task ? 'Lưu' : 'Giao việc'}</button>
      </>}
    >
      <div className="form-group">
        <label className="form-label">Nhân viên nhận việc *</label>
        <select className="form-control" value={form.employeeId} onChange={set('employeeId')}>
          <option value="">— Chọn nhân viên —</option>
          {employees.filter((e) => e.status === 'ACTIVE' || String(e.id) === form.employeeId).map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Tiêu đề *</label>
        <input className="form-control" value={form.title} onChange={set('title')} placeholder="Ví dụ: Hoàn thiện báo cáo tuần" />
      </div>
      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} />
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Hạn hoàn thành *</label>
          <input className="form-control" type="date" value={form.dueDate} onChange={set('dueDate')} />
          <div className="form-help">Tháng của hạn này quyết định kỳ KPI.</div>
        </div>
        <div className="form-group">
          <label className="form-label">Trọng số / độ khó</label>
          <select className="form-control" value={form.weight} onChange={set('weight')}>
            {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w}>{w} — {WEIGHT_LABELS[w]}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
