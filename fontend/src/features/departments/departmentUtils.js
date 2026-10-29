// Logic THUẦN của tính năng Phòng ban
export const DEFAULT_COLOR = '#3b82f6';

// Thống kê 1 phòng ban từ danh sách nhân viên + KPI kỳ hiện tại trong cache
export function statsOf(dept, emps, kpiCur) {
  const list = emps.filter((e) => e.department && e.department.id === dept.id);
  const kpis = list.map((e) => kpiCur[e.id]).filter((k) => k != null);
  return {
    count: list.length,
    salarySum: list.reduce((a, e) => a + e.salary, 0),
    avgKpi: kpis.length ? kpis.reduce((a, b) => a + b, 0) / kpis.length : 0,
  };
}

export const emptyDeptForm = () => ({ code: '', name: '', head: '', description: '', color: DEFAULT_COLOR });
export const formFromDept = (d) => ({
  code: d.code, name: d.name, head: d.head || '', description: d.description || '', color: d.color || DEFAULT_COLOR,
});

export function validateDepartment(form, depts, editId = null) {
  const code = form.code.trim();
  if (!code || !form.name.trim()) return 'Nhập mã và tên phòng ban';
  if (depts.some((d) => d.code === code && String(d.id) !== String(editId))) return 'Mã phòng ban đã tồn tại';
  return null;
}

export const toDeptPayload = (form) => ({
  code: form.code.trim(), name: form.name.trim(), head: form.head || null,
  description: form.description.trim() || null, color: form.color,
});
