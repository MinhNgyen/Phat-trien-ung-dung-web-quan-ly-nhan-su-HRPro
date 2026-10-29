'use client';
import { useState } from 'react';
import { kpiApi } from '@/api/kpi';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { fmtScore } from '@/lib/format';
import { buildKpiPayload, calcTotal, CRITERIA, initialScores } from './kpiUtils';

/** Chấm KPI cho 1 nhân viên trong 1 kỳ. existing = bản ghi KPI đã có (nếu có) -> cập nhật thay vì tạo mới. */
export default function KpiEvalModal({ employee, period, existing, onClose, onSaved }) {
  const { user } = useAuth();
  const { reload } = useRefs();
  const { run, busy } = useRun();
  const [scores, setScores] = useState(() => initialScores(existing));
  const set = (key) => (e) => setScores((s) => ({ ...s, [key]: e.target.value }));

  async function save() {
    const payload = buildKpiPayload(scores, employee.id, period, user.name);
    const ok = await run(async () => {
      if (existing) await kpiApi.update(existing.id, payload); else await kpiApi.create(payload);
      await reload(); // cập nhật điểm KPI hiển thị ở trang nhân viên / phòng ban
      return true;
    }, 'Không lưu được KPI.');
    if (ok) { onSaved(); onClose(); }
  }

  return (
    <Modal
      title={`🎯 Đánh giá KPI – ${employee.name} (${period})`}
      width={520}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>✓ Lưu đánh giá</button>
      </>}
    >
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Nhập điểm từng tiêu chí (0–100). KPI tổng = tổng có trọng số.</p>
      {CRITERIA.map((c) => (
        <div className="form-group" key={c.key}>
          <label className="form-label">
            {c.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(trọng số {Math.round(c.weight * 100)}%)</span>
          </label>
          <input className="form-control kpi-input" type="number" min="0" max="100" value={scores[c.key]} onChange={set(c.key)} />
        </div>
      ))}
      {/* chỉ xem trước; điểm chính thức do backend tính */}
      <div className="kpi-total-box">KPI tổng hợp: <strong>{fmtScore(calcTotal(scores))}</strong>/100</div>
    </Modal>
  );
}
