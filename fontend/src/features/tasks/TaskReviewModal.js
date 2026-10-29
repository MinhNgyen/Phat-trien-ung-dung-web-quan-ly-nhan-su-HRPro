'use client';
import { useState } from 'react';
import { tasksApi } from '@/api/tasks';
import Modal from '@/components/ui/Modal';
import { useRun } from '@/hooks/useRun';
import { todayStr } from '@/lib/format';
import { dayOf } from './taskUtils';

/** Quản lý duyệt việc hoàn thành: bắt buộc chấm chất lượng 0–100. */
export default function TaskReviewModal({ task, onClose, onSaved }) {
  const { run, busy } = useRun();
  const [quality, setQuality] = useState(task.quality != null ? String(task.quality) : '80');
  const [completedAt, setCompletedAt] = useState(dayOf(task.completedAt) || todayStr());

  async function approve() {
    const q = Number(quality);
    if (!Number.isInteger(q) || q < 0 || q > 100) { alert('Điểm chất lượng từ 0 đến 100'); return; }
    const ok = await run(async () => {
      await tasksApi.update(task.id, { status: 'DONE', quality: q, completedAt });
      return true;
    }, 'Không duyệt được đầu việc.');
    if (ok) { onSaved(); onClose(); }
  }

  async function rework() {
    const ok = await run(async () => {
      await tasksApi.update(task.id, { status: 'IN_PROGRESS' });
      return true;
    }, 'Không trả việc được.');
    if (ok) { onSaved(); onClose(); }
  }

  const emp = task.employee || {};
  return (
    <Modal
      title={`✅ Duyệt hoàn thành – ${emp.name || 'Nhân viên'}`}
      width={480}
      onClose={onClose}
      footer={<>
        {task.status === 'REVIEW' && (
          <button type="button" className="btn btn-outline" onClick={rework} disabled={busy}>↩ Yêu cầu làm lại</button>
        )}
        <button type="button" className="btn btn-outline" onClick={onClose}>Đóng</button>
        <button type="button" className="btn btn-primary" onClick={approve} disabled={busy}>✓ Duyệt & chấm điểm</button>
      </>}
    >
      <p style={{ fontSize: 13.5, marginBottom: 12 }}><strong>{task.title}</strong></p>
      {task.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{task.description}</p>}
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Hạn</label>
          <input className="form-control" value={dayOf(task.dueDate)} readOnly />
        </div>
        <div className="form-group">
          <label className="form-label">Ngày hoàn thành</label>
          <input className="form-control" type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Điểm chất lượng (0–100) *</label>
        <input className="form-control" type="number" min="0" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} />
        <div className="form-help">KPI kỳ này: 40% hoàn thành · 30% đúng hạn · 30% chất lượng (theo trọng số việc).</div>
      </div>
    </Modal>
  );
}
