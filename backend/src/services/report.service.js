const prisma = require('../config/database');
const { monthRange, toNumber, currentMonth, toDateOnly } = require('../utils/helpers');

// Tong hop so lieu cho dashboard - lay truc tiep tu MySQL
async function getDashboard() {
  const today = toDateOnly(new Date());
  const month = currentMonth();
  const { start, end } = monthRange(month);

  const [
    totalEmployees, activeEmployees, departments,
    todayAttendance, payrollAgg,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.department.count(),
    prisma.attendance.groupBy({ by: ['status'], where: { date: today }, _count: { _all: true } }),
    prisma.payroll.aggregate({ where: { month }, _sum: { netSalary: true } }),
  ]);

  const countBy = (s) => {
    const row = todayAttendance.find((r) => r.status === s);
    return row ? row._count._all : 0;
  };

  return {
    totalEmployees,
    activeEmployees,
    departments,
    presentToday: countBy('PRESENT'),
    lateToday: countBy('LATE'),
    absentToday: countBy('ABSENT'),
    onLeaveToday: countBy('LEAVE'),
    monthlyPayroll: toNumber(payrollAgg._sum.netSalary),
    month,
    date: today.toISOString().slice(0, 10),
    _range: { start, end },
  };
}

// Bao cao nhan su: theo phong ban, theo trang thai
async function getEmployeeReport() {
  const [byDepartment, byStatus, total, salaryAgg] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, code: true, name: true, color: true, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.employee.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.employee.count(),
    prisma.employee.aggregate({ _avg: { salary: true }, _sum: { salary: true } }),
  ]);

  return {
    total,
    averageSalary: Math.round(toNumber(salaryAgg._avg.salary)),
    totalSalary: toNumber(salaryAgg._sum.salary),
    byDepartment: byDepartment.map((d) => ({
      id: d.id, code: d.code, name: d.name, color: d.color, employees: d._count.employees,
    })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
  };
}

// Bao cao cham cong theo thang
async function getAttendanceReport(month = currentMonth()) {
  const { start, end } = monthRange(month);
  const where = { date: { gte: start, lt: end } };

  const [byStatus, records] = await Promise.all([
    prisma.attendance.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, employeeCode: true, name: true } } },
    }),
  ]);

  // Tong hop theo tung nhan vien
  const perEmployee = {};
  for (const r of records) {
    const key = r.employeeId;
    if (!perEmployee[key]) {
      perEmployee[key] = {
        employeeId: key, employeeCode: r.employee.employeeCode, name: r.employee.name,
        present: 0, late: 0, absent: 0, leave: 0, workHours: 0, lateMinutes: 0,
      };
    }
    const e = perEmployee[key];
    if (r.status === 'PRESENT') e.present += 1;
    if (r.status === 'LATE') e.late += 1;
    if (r.status === 'ABSENT') e.absent += 1;
    if (r.status === 'LEAVE') e.leave += 1;
    e.workHours += toNumber(r.workHours);
    e.lateMinutes += r.lateMinutes || 0;
  }

  return {
    month,
    totalRecords: records.length,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    employees: Object.values(perEmployee).map((e) => ({ ...e, workHours: Math.round(e.workHours * 100) / 100 })),
  };
}

// Bao cao luong theo thang
async function getPayrollReport(month = currentMonth()) {
  const [agg, rows, lock] = await Promise.all([
    prisma.payroll.aggregate({
      where: { month },
      _sum: { grossSalary: true, netSalary: true, tax: true, overtime: true, deduction: true },
      _avg: { netSalary: true },
      _count: { _all: true },
    }),
    prisma.payroll.findMany({
      where: { month },
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, department: { select: { id: true, name: true } } },
        },
      },
      orderBy: { netSalary: 'desc' },
    }),
    prisma.salaryLock.findUnique({ where: { month } }),
  ]);

  return {
    month,
    isLocked: !!(lock && lock.isLocked),
    totalRecords: agg._count._all,
    totalGross: toNumber(agg._sum.grossSalary),
    totalNet: toNumber(agg._sum.netSalary),
    totalTax: toNumber(agg._sum.tax),
    totalOvertime: toNumber(agg._sum.overtime),
    totalDeduction: toNumber(agg._sum.deduction),
    averageNet: Math.round(toNumber(agg._avg.netSalary)),
    items: rows,
  };
}

// Bao cao KPI theo ky
async function getKpiReport(period = currentMonth()) {
  const rows = await prisma.kpi.findMany({
    where: { period },
    include: {
      employee: {
        select: { id: true, employeeCode: true, name: true, department: { select: { id: true, name: true } } },
      },
    },
    orderBy: { total: 'desc' },
  });

  const totals = rows.map((r) => toNumber(r.total));
  const average = totals.length ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100 : 0;

  // Xep loai theo diem tong
  const classify = (t) => (t >= 90 ? 'Xuat sac' : t >= 80 ? 'Tot' : t >= 65 ? 'Kha' : t >= 50 ? 'Trung binh' : 'Yeu');
  const distribution = {};
  for (const t of totals) {
    const label = classify(t);
    distribution[label] = (distribution[label] || 0) + 1;
  }

  return {
    period,
    totalRecords: rows.length,
    average,
    top5: rows.slice(0, 5),
    distribution,
    items: rows,
  };
}

module.exports = { getDashboard, getEmployeeReport, getAttendanceReport, getPayrollReport, getKpiReport };
