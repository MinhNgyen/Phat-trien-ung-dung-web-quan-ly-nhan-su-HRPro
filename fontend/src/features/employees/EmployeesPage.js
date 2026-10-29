'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { employeesApi } from '@/api/employees';
import { downloadCSV } from '@/lib/csv';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import EmployeeFilters from './EmployeeFilters';
import EmployeeTable from './EmployeeTable';
import EmployeeCards from './EmployeeCards';
import EmployeeFormModal from './EmployeeFormModal';
import { employeesToCsvRows, filterEmployees } from './employeeUtils';

export default function EmployeesPage() {
  const { can } = useAuth();
  const { emps, depts, kpiCur, reload } = useRefs();
  const { run } = useRun();
  const params = useSearchParams();
  const urlQ = params.get('q') || ''; // từ ô tìm kiếm trên header
  const urlDept = params.get('dept') || ''; // từ biểu đồ ở Dashboard
  const [tab, setTab] = useState('list');
  const [filters, setFilters] = useState({ q: urlQ, dept: urlDept, status: '' });
  const [editing, setEditing] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
  const canEdit = can('admin,hr');

  useEffect(() => { setFilters((f) => ({ ...f, q: urlQ, dept: urlDept })); }, [urlQ, urlDept]);
  const list = useMemo(() => filterEmployees(emps, filters), [emps, filters]);

  async function handleDelete(e) {
    if (!canEdit || !confirm(`Xóa nhân viên ${e.name} (${e.employeeCode})?`)) return;
    await run(async () => { await employeesApi.remove(e.id); await reload(); return true; }, 'Không xóa được nhân viên.');
  }

  return (
    <div className="page active">
      <PageHeader title="Quản lý Nhân viên" subtitle={`${emps.length} nhân viên`}>
        <button type="button" className="btn btn-outline" onClick={() => downloadCSV('danh_sach_nhan_vien.csv', employeesToCsvRows(emps, kpiCur))}>📤 Xuất CSV</button>
        <Can roles="admin,hr"><button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>+ Thêm nhân viên</button></Can>
      </PageHeader>

      <div className="tabs">
        <div className={'tab' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>📋 Danh sách</div>
        <div className={'tab' + (tab === 'cards' ? ' active' : '')} onClick={() => setTab('cards')}>🗂️ Thẻ nhân viên</div>
      </div>

      {tab === 'list' ? (
        <div className="card">
          <div className="card-header"><EmployeeFilters filters={filters} onChange={setFilters} depts={depts} /></div>
          <EmployeeTable employees={list} kpiCur={kpiCur} canEdit={canEdit} onEdit={setEditing} onDelete={handleDelete} />
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><EmployeeFilters filters={filters} onChange={setFilters} depts={depts} /></div>
          </div>
          <EmployeeCards employees={list} kpiCur={kpiCur} />
        </>
      )}

      {editing !== undefined && canEdit && <EmployeeFormModal employee={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
