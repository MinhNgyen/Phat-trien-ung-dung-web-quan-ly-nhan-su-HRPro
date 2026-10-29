'use client';
import { useState } from 'react';
import { shiftsApi } from '@/api/shifts';
import Can from '@/components/Can';
import BarChart from '@/components/ui/BarChart';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import { avColor } from '@/lib/format';
import ShiftFormModal from './ShiftFormModal';
import ShiftTable from './ShiftTable';
import { deleteShiftMessage } from './shiftUtils';

export default function ShiftsPage() {
  const { can } = useAuth();
  const { shifts, reload } = useRefs();
  const { run } = useRun();
  const [editing, setEditing] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
  const canEdit = can('admin,hr');

  async function handleDelete(s) {
    if (!canEdit || !confirm(deleteShiftMessage(s))) return;
    await run(async () => { await shiftsApi.remove(s.id); await reload(); return true; }, 'Không xóa được ca làm việc.');
  }

  return (
    <div className="page active">
      <PageHeader title="Ca làm việc" subtitle="Quản lý ca: giờ vào/ra, quy định đi muộn, hệ số OT">
        <Can roles="admin,hr"><button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>+ Thêm ca làm</button></Can>
      </PageHeader>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Danh sách ca làm việc</div></div>
        <ShiftTable shifts={shifts} canEdit={canEdit} onEdit={setEditing} onDelete={handleDelete} />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Số nhân viên mỗi ca</div></div>
        <div className="card-body">
          <BarChart height={140} data={shifts.map((s, i) => ({ label: s.name, value: s.employeeCount || 0, color: avColor(i) }))} />
        </div>
      </div>

      {editing !== undefined && canEdit && <ShiftFormModal shift={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
