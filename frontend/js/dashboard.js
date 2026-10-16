/**
 * dashboard.js — Dashboard (GET /reports/dashboard) và trang Báo cáo & Thống kê.
 */
(function () {
  'use strict';
  const { state, $, esc, fmt, fmtScore, run, isSelf, can, empAvatar, deptTag, deptColor, statusBadge, kpiBadge,
    renderBarChart, renderDonut } = HR;

  // Gom nhân viên theo phòng ban: { tênPB: { count, salarySum, color } }
  function groupByDept() {
    const g = {};
    state.emps.forEach((e) => {
      const n = e.department ? e.department.name : 'Chưa có';
      g[n] = g[n] || { count: 0, salarySum: 0, color: deptColor(e.department) };
      g[n].count++; g[n].salarySum += e.salary;
    });
    return g;
  }

  async function renderDashboard() {
    await run(async () => {
      const d = await window.API.getDashboard();
      const present = d.presentToday + d.lateToday;
      $('stat-total').textContent = d.totalEmployees;
      $('stat-active-lbl').textContent = d.activeEmployees + ' đang làm việc';
      $('stat-attend').textContent = (d.totalEmployees ? Math.min(100, Math.round((present / d.totalEmployees) * 100)) : 0) + '%';
      $('stat-attend-lbl').textContent = present + '/' + d.totalEmployees + ' có mặt';

      // Quỹ lương: ưu tiên số thực chi đã tính trong tháng, nếu chưa tính thì hiện tổng lương cơ bản
      const baseSum = state.emps.reduce((a, e) => a + e.salary, 0);
      $('stat-salary-lbl').textContent = fmt(d.monthlyPayroll || baseSum);
      $('stat-salary-sub').textContent = d.monthlyPayroll ? 'Thực chi tháng ' + d.month : 'Lương cơ bản (chưa tính lương kỳ này)';

      // KPI trung bình kỳ hiện tại (nhân viên thường: KPI của chính mình)
      let kpiVals = Object.values(state.kpiCur);
      if (isSelf()) { const mine = await window.API.getKPIByEmployee(state.me.employeeId); kpiVals = mine.slice(0, 1).map((k) => k.total); }
      $('stat-kpi-lbl').textContent = kpiVals.length ? fmtScore(kpiVals.reduce((a, b) => a + b, 0) / kpiVals.length) : '—';

      const lb = $('late-badge'); if (lb) { lb.textContent = d.lateToday; lb.style.display = d.lateToday ? '' : 'none'; }

      const g = groupByDept(); const names = Object.keys(g);
      renderBarChart($('chart-dept-salary'), names.map((n) => ({ label: n, value: g[n].salarySum, color: g[n].color })), { fmtValue: (v) => fmt(v / 1e6) + 'tr' });
      renderDonut($('donut-svg'), $('donut-legend'), names.map((n) => ({ label: n, value: g[n].count, color: g[n].color })));
      $('dash-table').innerHTML = state.emps.slice(0, 6).map((e) => `<tr>
        <td><div class="emp-cell">${empAvatar(e)}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.position || '')}</div></div></div></td>
        <td>${deptTag(e.department)}</td><td>${fmt(e.salary)}</td><td>${kpiBadge(state.kpiCur[e.id])}</td><td>${statusBadge(e.status)}</td></tr>`).join('');
    }, 'Không tải được dashboard.');
  }

  async function renderReports() {
    await run(async () => {
      const rep = await window.API.getEmployeeReport(); // { byDepartment:[{name,color,employees}], ... }
      renderBarChart($('chart-report-dept'), rep.byDepartment.map((d) => ({ label: d.name, value: d.employees, color: d.color || deptColor(d) })));
      const g = groupByDept(); const total = Object.values(g).reduce((a, x) => a + x.salarySum, 0) || 1;
      $('report-salary-share').innerHTML = Object.keys(g).map((n) => {
        const pct = Math.round((g[n].salarySum / total) * 100);
        return `<div class="kpi-bar-row"><div class="kpi-bar-lbl">${esc(n)}</div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${pct}%;background:${g[n].color}"></div></div>
          <div class="kpi-bar-val">${pct}%</div></div>`;
      }).join('');
    }, 'Không tải được báo cáo.');
  }

  void can;
  HR.pages.dashboard = renderDashboard;
  HR.pages.reports = renderReports;
  Object.assign(window, { renderDashboard, renderReports });
})();
