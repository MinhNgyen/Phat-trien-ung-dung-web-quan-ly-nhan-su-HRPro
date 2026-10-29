// Logic THUẦN của Dashboard. d = dữ liệu từ GET /reports/dashboard
export function attendanceStat(d) {
  const present = d.presentToday + d.lateToday;
  return { present, percent: d.totalEmployees ? Math.min(100, Math.round((present / d.totalEmployees) * 100)) : 0 };
}

// Quỹ lương: ưu tiên số thực chi đã tính trong tháng; chưa tính thì hiện tổng lương cơ bản
export function payrollStat(d, baseSalary) {
  return d.monthlyPayroll
    ? { value: d.monthlyPayroll, sub: `Thực chi tháng ${d.month}` }
    : { value: baseSalary, sub: 'Lương cơ bản (chưa tính lương kỳ này)' };
}

export const averageOf = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export const greetingOf = (hour) => (hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');

const deptNameOf = (e) => (e.department ? e.department.name : 'Chưa có');

// Lọc nhân viên theo tên phòng ban ('' = tất cả)
export const filterByDept = (emps, name) => (name ? emps.filter((e) => deptNameOf(e) === name) : emps);

// Số liệu chi tiết của 1 phòng ban (hiện khi bấm vào biểu đồ)
export function deptDetail(emps, name, kpiCur) {
  const list = filterByDept(emps, name);
  const withDept = list.find((e) => e.department);
  return {
    name,
    id: withDept ? withDept.department.id : null,
    count: list.length,
    active: list.filter((e) => e.status === 'ACTIVE').length,
    salarySum: list.reduce((a, e) => a + e.salary, 0),
    avgKpi: averageOf(list.map((e) => kpiCur[e.id]).filter((k) => k != null)),
  };
}

// ---- Khu "việc cần xử lý" theo vai trò ----

// Chia chấm công hôm nay: đi muộn / vắng / nghỉ phép (từ bản ghi) và nhân viên đang làm CHƯA có bản ghi nào
export function attendanceBuckets(emps, rows) {
  const checked = new Set(rows.map((r) => r.employeeId));
  return {
    late: rows.filter((r) => r.status === 'LATE'),
    absent: rows.filter((r) => r.status === 'ABSENT'),
    leave: rows.filter((r) => r.status === 'LEAVE'),
    missing: emps.filter((e) => e.status === 'ACTIVE' && !checked.has(e.id)),
  };
}

// Nhân viên đang làm nhưng chưa được chấm KPI kỳ hiện tại
export const pendingKpi = (emps, kpiCur) => emps.filter((e) => e.status === 'ACTIVE' && kpiCur[e.id] == null);

// Đếm tài khoản theo vai trò, theo thứ tự roleKeys (vai trò không có tài khoản vẫn hiện với count 0)
export function countByRole(users, roleKeys) {
  return roleKeys.map((role) => ({ role, count: users.filter((u) => String(u.role).toLowerCase() === role).length }));
}
