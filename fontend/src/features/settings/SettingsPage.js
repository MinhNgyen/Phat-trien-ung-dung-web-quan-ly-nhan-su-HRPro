'use client';
import { useCallback, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { settingsApi } from '@/api/settings';
import Can from '@/components/Can';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useRefs } from '@/context/RefsContext';
import { useRun } from '@/hooks/useRun';
import CompanyCard from './CompanyCard';
import PayrollConfigCard from './PayrollConfigCard';
import UsersTable from './UsersTable';
import { buildSettingsPayload, emptySettingsForm, formFromSettings } from './settingsUtils';

export default function SettingsPage() {
  const { can } = useAuth();
  const { emps } = useRefs();
  const { run, busy } = useRun();
  const [form, setForm] = useState(emptySettingsForm);
  const [users, setUsers] = useState([]);
  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isAdmin = can('admin');

  useEffect(() => {
    let alive = true;
    run(async () => {
      const s = await settingsApi.getPayroll();
      const list = isAdmin ? await authApi.users() : [];
      if (!alive) return;
      setForm(formFromSettings(s));
      setUsers(list);
    }, 'Không tải được cấu hình.');
    return () => { alive = false; };
  }, [isAdmin, run]);

  const save = useCallback(async () => {
    if (!can('admin,accountant')) return;
    const { payload, error } = buildSettingsPayload(form);
    if (error) { alert(error); return; }
    const ok = await run(async () => { await settingsApi.updatePayroll(payload); return true; }, 'Không lưu được cấu hình.');
    if (ok) alert('✓ Đã lưu cấu hình. Áp dụng từ lần tính lương tiếp theo (bảng lương đã tính trước đó giữ nguyên).');
  }, [can, form, run]);

  return (
    <div className="page active">
      <PageHeader title="Cài đặt hệ thống" subtitle="Các tham số dưới đây được dùng trực tiếp khi tính lương" />
      <div className="grid-2">
        <CompanyCard form={form} onChange={onChange} employeeCount={emps.length} onSave={save} busy={busy} />
        <PayrollConfigCard form={form} onChange={onChange} onSave={save} busy={busy} />
      </div>
      <Can roles="admin"><UsersTable users={users} /></Can>
    </div>
  );
}
