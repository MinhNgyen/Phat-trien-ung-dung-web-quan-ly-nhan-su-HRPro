/**
 * payroll.js — Trang Tính lương. Số liệu do BACKEND tính (POST /payroll/calculate) từ chấm công thật
 * + cấu hình ở trang Cài đặt; client chỉ hiển thị. Bản ghi lương:
 * { id, employeeId, month, baseSalary, workDays, standardDays, overtime, allowance, deduction,
 *   grossSalary, tax, netSalary, note, employee:{id,employeeCode,name,position,department} }
 */
(function () {
  'use strict';
  const { state, $, esc, fmt, can, run, isSelf, curMonth, avColor, empCell, deptTag, openModal, downloadCSV, renderBarChart } = HR;

  let data = { month: '', isLocked: false, items: [] };
  let bucket = null; // lọc theo cột trong biểu đồ phân phối
  let seq = 0;
  const BUCKETS = [{ label: '<10tr', min: 0, max: 10e6 }, { label: '10–15tr', min: 10e6, max: 15e6 },
    { label: '15–20tr', min: 15e6, max: 20e6 }, { label: '20–25tr', min: 20e6, max: 25e6 }, { label: '≥25tr', min: 25e6, max: Infinity }];

  const curSalMonth = () => { const el = $('sal-month'); if (el && !el.value) el.value = curMonth(); return el ? el.value : curMonth(); };

  async function renderSalary() {
    const month = curSalMonth();
    const mine = ++seq;
    await run(async () => {
      let d;
      if (isSelf()) { // nhân viên chỉ xem phiếu lương của mình
        const [list, locks] = await Promise.all([window.API.getPayrollByEmployee(state.me.employeeId), window.API.getSalaryLocks()]);
        d = { month, items: list.filter((p) => p.month === month), isLocked: locks.some((l) => l.month === month && l.isLocked) };
      } else {
        d = await window.API.getPayrollByMonth(month);
      }
      if (mine !== seq) return;
      data = d;
      draw(month);
    }, 'Không tải được bảng lương.');
  }

  function draw(month) {
    const items = data.items;
    const nets = items.map((p) => p.netSalary);
    const total = nets.reduce((a, b) => a + b, 0);
    $('sal-total').textContent = fmt(total);
    $('sal-avg').textContent = items.length ? fmt(total / items.length) : 0;
    $('sal-max').textContent = nets.length ? fmt(Math.max(...nets)) : 0;
    $('sal-min').textContent = nets.length ? fmt(Math.min(...nets)) : 0;
    renderBarChart($('chart-salary-dist'),
      BUCKETS.map((b, i) => ({ label: b.label, value: items.filter((p) => p.netSalary >= b.min && p.netSalary < b.max).length, color: bucket === i ? '#1d4ed8' : avColor(i) })),
      { clickable: true, onClick: 'filterSalaryByBucket' });

    const badge = $('sal-status-badge');
    badge.className = 'badge ' + (data.isLocked ? 'badge-success' : 'badge-warning');
    badge.textContent = data.isLocked ? '✓ Đã chốt' : 'Chưa chốt';
    const btn = $('sal-confirm-btn');
    btn.textContent = data.isLocked ? '🔓 Mở khóa bảng lương' : '🔒 Kế toán chốt lương';
    if (data.isLocked && HR.role() !== 'admin') btn.style.display = 'none'; // chỉ ADMIN được mở khóa
    $('salary-period-lbl').textContent = 'Bảng lương kỳ ' + month + ' — tính từ bảng công thật + cấu hình ở trang Cài đặt';
    HR.fillDeptFilters();
    renderSalaryTable();
  }

  function renderSalaryTable() {
    let items = data.items;
    const dept = ($('sal-dept-filter') || {}).value || '';
    if (dept) items = items.filter((p) => p.employee.department && String(p.employee.department.id) === dept);
    if (bucket != null) items = items.filter((p) => p.netSalary >= BUCKETS[bucket].min && p.netSalary < BUCKETS[bucket].max);
    const empty = data.items.length ? 'Không có dữ liệu phù hợp bộ lọc'
      : 'Chưa tính lương cho kỳ này' + (can('admin,accountant') ? ' — bấm "Tính lương kỳ này" để tạo bảng lương' : '');
    $('salary-tbody').innerHTML = items.map((p) => `<tr>
      <td>${empCell(p.employee)}</td><td>${deptTag(p.employee.department)}</td>
      <td>${fmt(p.baseSalary)}</td><td>${p.workDays}/${p.standardDays}</td>
      <td style="color:var(--success)">+${fmt(p.allowance)}</td>
      <td>${p.overtime ? '+' + fmt(p.overtime) : '—'}</td>
      <td style="color:var(--danger)">${p.deduction ? '-' + fmt(p.deduction) : '—'}</td>
      <td>${fmt(p.grossSalary)}</td>
      <td style="color:var(--danger)">${p.tax ? '-' + fmt(p.tax) : '0'}</td>
      <td><strong style="color:var(--primary)">${fmt(p.netSalary)}</strong></td>
      <td><button class="icon-btn" title="Phiếu lương" onclick="showPayslip(${p.id})">📄</button></td></tr>`).join('')
      || `<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:24px">${empty}</td></tr>`;
  }
  function filterSalaryByBucket(i) { bucket = bucket === i ? null : i; draw(curSalMonth()); }

  // Gọi backend tính lương cả tháng cho mọi nhân viên đang làm việc
  async function calculatePayrollNow() {
    if (!can('admin,accountant')) return;
    const month = curSalMonth();
    if (data.isLocked) { alert('Bảng lương kỳ ' + month + ' đã chốt. Hãy mở khóa (Admin) trước khi tính lại.'); return; }
    if (!confirm('Tính lương kỳ ' + month + ' từ dữ liệu chấm công? Bảng lương đã tính trước đó của kỳ này sẽ được cập nhật lại.')) return;
    const ok = await run(async () => { await window.API.calculatePayroll(month); return true; }, 'Không tính được lương.');
    if (ok) renderSalary();
  }

  async function toggleSalaryLock() {
    if (!can('admin,accountant')) return;
    const month = curSalMonth();
    if (!data.isLocked && !confirm('Chốt bảng lương kỳ ' + month + '? Sau khi chốt, không thể tính lại hay sửa bảng lương.')) return;
    const ok = await run(async () => {
      if (data.isLocked) await window.API.unlockPayroll(month); else await window.API.lockPayroll(month);
      return true;
    }, 'Không đổi được trạng thái chốt lương.');
    if (ok) renderSalary();
  }

  // Tên công ty trên phiếu lương lấy từ cấu hình (nhân viên thường không có quyền xem cấu hình -> dùng tên mặc định)
  async function companyName() {
    if (state.company) return state.company;
    try { state.company = (await window.API.getPayrollSettings()).company || 'HRPro'; } catch (e) { state.company = 'HRPro'; }
    return state.company;
  }

  async function showPayslip(id) {
    const p = data.items.find((x) => x.id === Number(id));
    if (!p) return;
    const company = await companyName();
    const income = p.baseSalary + p.allowance + p.overtime;
    $('payslip-body').innerHTML = `
      <div style="text-align:center;margin-bottom:14px"><div style="font-weight:700;font-size:16px">${esc(company)}</div>
        <div style="color:var(--text-muted);font-size:13px">Phiếu lương kỳ ${esc(p.month)}</div></div>
      <div class="ps-row"><span>Nhân viên</span><strong>${esc(p.employee.name)} (${esc(p.employee.employeeCode)})</strong></div>
      <div class="ps-row"><span>Phòng ban / Chức vụ</span><span>${esc((p.employee.department || {}).name || '')} · ${esc(p.employee.position || '')}</span></div>
      <div class="ps-row"><span>Công thực tế</span><span>${p.workDays}/${p.standardDays} công</span></div>
      <hr class="ps-hr">
      <div class="ps-row"><span>Lương theo công</span><strong>${fmt(p.baseSalary)}</strong></div>
      <div class="ps-row"><span>Phụ cấp (ăn trưa + xăng + điện thoại)</span><span style="color:var(--success)">+${fmt(p.allowance)}</span></div>
      ${p.overtime ? `<div class="ps-row"><span>Tăng ca (OT)</span><span style="color:var(--success)">+${fmt(p.overtime)}</span></div>` : ''}
      <div class="ps-row"><span>Tổng thu nhập</span><strong>${fmt(income)}</strong></div>
      <hr class="ps-hr">
      <div class="ps-row"><span>Khấu trừ (BHXH+BHYT+BHTN, phạt đi muộn...)</span><span style="color:var(--danger)">-${fmt(p.deduction)}</span></div>
      <div class="ps-row"><span>Thu nhập tính thuế</span><span>${fmt(p.grossSalary)}</span></div>
      <div class="ps-row"><span>Thuế TNCN</span><span style="color:var(--danger)">-${fmt(p.tax)}</span></div>
      <hr class="ps-hr">
      <div class="ps-row" style="font-size:16px"><span><strong>Thực nhận</strong></span><strong style="color:var(--primary)">${fmt(p.netSalary)} đ</strong></div>
      ${p.note ? `<div class="ci-preview" style="margin-top:10px">${esc(p.note)}</div>` : ''}`;
    openModal('payslip-modal');
  }

  function exportSalaryCSV() {
    if (!can('admin,accountant')) { alert('Chỉ Kế toán/Admin được xuất bảng lương'); return; }
    const month = curSalMonth();
    const out = [['Mã NV', 'Họ tên', 'Phòng ban', 'Lương theo công', 'Công TT', 'Công chuẩn', 'Phụ cấp', 'OT', 'Khấu trừ', 'Lương trước thuế', 'Thuế TNCN', 'Thực nhận']];
    data.items.forEach((p) => out.push([p.employee.employeeCode, p.employee.name, (p.employee.department || {}).name || '', p.baseSalary, p.workDays,
      p.standardDays, p.allowance, p.overtime, p.deduction, p.grossSalary, p.tax, p.netSalary]));
    downloadCSV('bang_luong_' + month + '.csv', out);
  }

  HR.pages.salary = renderSalary;
  Object.assign(window, { renderSalary, renderSalaryTable, filterSalaryByBucket, calculatePayrollNow, toggleSalaryLock, showPayslip, exportSalaryCSV });
})();
