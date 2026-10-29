'use client';
import { useState } from 'react';
import { departmentsApi } from '@/api/departments';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import DepartmentCard from './DepartmentCard';
import DepartmentFormModal from './DepartmentFormModal';
import { statsOf } from './departmentUtils';

export default function DepartmentsPage() {
  const { can } = useAuth();
  const { depts, emps, kpiCur, reload } = useRefs();
  const { run } = useRun();
  const [editing, setEditing] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
  const canEdit = can('admin,hr');

  // Backend tự chặn (409) nếu phòng ban còn nhân viên -> useRun sẽ hiện thông báo
  async function handleDelete(d) {
    if (!canEdit || !confirm(`Xóa phòng ban ${d.name}?`)) return;
    await run(async () => { await departmentsApi.remove(d.id); await reload(); return true; }, 'Không xóa được phòng ban.');
  }

  return (
    <div className="page active">
      <PageHeader title="Phòng ban & Tổ chức" subtitle="Quản lý phòng ban: mã, trưởng phòng, mô tả">
        <Can roles="admin,hr"><button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>+ Thêm phòng ban</button></Can>
      </PageHeader>

      <div className="grid-3">
        {depts.map((d) => (
          <DepartmentCard key={d.id} dept={d} stats={statsOf(d, emps, kpiCur)} canEdit={canEdit}
            onEdit={setEditing} onDelete={handleDelete} />
        ))}
        {depts.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 20 }}>Chưa có phòng ban nào</div>}
      </div>

      {editing !== undefined && canEdit && <DepartmentFormModal dept={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
