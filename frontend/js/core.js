/**
 * core.js — Nền tảng dùng chung của frontend HRPro.
 *
 * Mọi module khác (employees.js, attendance.js...) chỉ dùng namespace `HR` được tạo ở đây,
 * không khai báo biến toàn cục riêng -> tránh lỗi trùng tên giữa các file.
 * Dữ liệu KHÔNG còn lưu localStorage: mọi thứ lấy từ backend qua window.API (api.js).
 */
(function () {
  'use strict';

  const HR = (window.HR = {
    // Cache dữ liệu danh mục, nạp bằng loadRefs() sau khi đăng nhập / sau mỗi lần CRUD
    state: { me: null, depts: [], shifts: [], emps: [], kpiCur: {}, company: '' },
    pages: {}, // HR.pages[tênTrang] = hàm render, do từng module đăng ký
  });
  const state = HR.state;

  /* ===================== HẰNG SỐ ===================== */
  const AVC = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#06b6d4', '#6366f1', '#ec4899', '#14b8a6',
    '#f97316', '#84cc16', '#a855f7', '#fb923c', '#22d3ee', '#e879f9', '#4ade80', '#f43f5e', '#60a5fa', '#fbbf24'];
  const ROLES = {
    admin: { label: 'Quản trị viên', scope: 'Toàn hệ thống' },
    hr: { label: 'Nhân sự (HR)', scope: 'Nhân viên, phòng ban, chấm công' },
    accountant: { label: 'Kế toán', scope: 'Tính lương, chốt lương' },
    manager: { label: 'Quản lý', scope: 'Nhân viên, KPI, chấm công' },
    employee: { label: 'Nhân viên', scope: 'Xem thông tin cá nhân' },
  };
  const PAGE_TITLES = {
    dashboard: 'Dashboard', employees: 'Quản lý Nhân viên', departments: 'Phòng ban', shifts: 'Ca làm việc',
    attendance: 'Chấm công', salary: 'Tính lương', performance: 'Hiệu suất & KPI', reports: 'Báo cáo & Thống kê', settings: 'Cài đặt',
  };

  /* ===================== TIỆN ÍCH NHỎ ===================== */
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const curMonth = () => todayStr().slice(0, 7);
  const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
  const fmt = (n) => Number(Math.round(Number(n) || 0)).toLocaleString('vi-VN');
  const fmtScore = (n) => String(Math.round((Number(n) || 0) * 10) / 10);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initials = (name) => { const p = String(name || '?').trim().split(/\s+/); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
  const avColor = (i) => AVC[Math.abs(Number(i) || 0) % AVC.length];
  const selectValues = (sel) => [...((sel && sel.selectedOptions) || [])].map((o) => o.value);
  const setSelectValues = (sel, values) => {
    const set = new Set((values || []).map(String));
    [...((sel && sel.options) || [])].forEach((o) => { o.selected = set.has(o.value); });
  };

  /* ===================== PHÂN QUYỀN ===================== */
  const role = () => (state.me ? state.me.role : null);
  const can = (list) => list.split(',').map((s) => s.trim()).includes(role());
  const isSelf = () => role() === 'employee'; // nhân viên thường chỉ xem dữ liệu của chính mình

  // Ẩn/hiện mọi phần tử có data-roles theo vai trò hiện tại
  function applyRolePermissions() {
    const r = role();
    document.querySelectorAll('[data-roles]').forEach((el) => {
      el.style.display = el.getAttribute('data-roles').split(',').map((s) => s.trim()).includes(r) ? '' : 'none';
    });
  }

  /* ===================== TRA CỨU TRONG CACHE ===================== */
  const empById = (id) => state.emps.find((e) => e.id === Number(id));
  const deptById = (id) => state.depts.find((d) => d.id === Number(id));
  const shiftById = (id) => state.shifts.find((s) => s.id === Number(id));
  const deptColor = (dept) => (dept && (dept.color || (deptById(dept.id) || {}).color)) || '#94a3b8';

  /* ===================== THÀNH PHẦN GIAO DIỆN DÙNG LẠI ===================== */
  const statusBadge = (st) => (st === 'ACTIVE' ? '<span class="badge badge-success">Đang làm</span>'
    : st === 'LEAVE' ? '<span class="badge badge-warning">Nghỉ phép</span>'
      : '<span class="badge badge-gray">Đã nghỉ việc</span>');
  const kpiBadge = (k) => {
    if (k == null) return '<span class="badge badge-gray">—</span>';
    const cls = k >= 90 ? 'badge-success' : k >= 75 ? 'badge-info' : k >= 60 ? 'badge-warning' : 'badge-danger';
    return `<span class="badge ${cls}">${fmtScore(k)}</span>`;
  };
  const empAvatar = (e) => `<div class="emp-avatar" style="background:${avColor(e.id)}">${esc(initials(e.name))}</div>`;
  const deptTag = (dept) => {
    if (!dept) return '<span class="badge badge-gray">Chưa có</span>';
    const c = deptColor(dept);
    return `<span class="dept-tag" style="background:${c}22;color:${c}">${esc(dept.name)}</span>`;
  };
  const shiftChips = (emp) => {
    const list = (emp && emp.shifts) || [];
    return list.length ? list.map((s) => `<span class="shift-chip">${esc(s.name)}</span>`).join('') : '<span class="badge badge-gray">Chưa phân ca</span>';
  };
  const empCell = (e) => `<div class="emp-cell">${empAvatar(e)}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.employeeCode || '')}</div></div></div>`;

  /* ===================== MODAL ===================== */
  const openModal = (id) => { const m = $(id); if (m) m.classList.add('show'); };
  const closeModal = (id) => { const m = $(id); if (m) m.classList.remove('show'); };
  const closeModalOnOverlay = (ev, id) => { if (ev.target.id === id) closeModal(id); };

  /* ===================== GỌI API AN TOÀN + TRẠNG THÁI LOADING ===================== */
  const style = document.createElement('style');
  style.textContent = '.is-loading{opacity:.55;pointer-events:none;transition:opacity .15s}';
  document.head.appendChild(style);

  let busyCount = 0;
  function busy(on) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    const pc = $('page-content');
    if (pc) pc.classList.toggle('is-loading', busyCount > 0);
  }
  /**
   * Chạy 1 hàm async: bật loading, bắt lỗi và báo bằng alert.
   * Nếu token hết hạn (api.js đã xoá token) -> tự quay về màn hình đăng nhập.
   * Trả về kết quả của fn, hoặc undefined nếu có lỗi.
   */
  async function run(fn, failMsg) {
    busy(true);
    try {
      return await fn();
    } catch (err) {
      if (!window.API.isLoggedIn()) { HR.showLogin('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'); return undefined; }
      console.error(err);
      alert(err.message || failMsg || 'Có lỗi xảy ra, vui lòng thử lại.');
      return undefined;
    } finally {
      busy(false);
    }
  }

  /* ===================== NẠP DỮ LIỆU DANH MỤC ===================== */
  /**
   * Nạp phòng ban + ca + nhân viên (+ KPI kỳ hiện tại) vào cache state.
   * Nhân viên thường không có quyền xem danh sách -> chỉ nạp hồ sơ của chính mình.
   */
  async function loadRefs() {
    const canList = can('admin,hr,accountant,manager');
    const [depts, shifts, empData, kpiList] = await Promise.all([
      window.API.getDepartments(),
      window.API.getShifts(),
      canList ? window.API.getEmployees({ limit: 500 }) : Promise.resolve(null),
      canList ? window.API.getKPI({ period: curMonth() }).catch(() => []) : Promise.resolve([]),
    ]);
    state.depts = depts;
    state.shifts = shifts;
    state.kpiCur = {};
    kpiList.forEach((k) => { state.kpiCur[k.employeeId] = k.total; });
    if (canList) state.emps = empData.items;
    else state.emps = state.me && state.me.employeeId ? [await window.API.getEmployee(state.me.employeeId)] : [];
    return true;
  }

  // Đổ danh sách phòng ban vào các ô lọc (value = id phòng ban)
  function fillDeptFilters() {
    const opts = '<option value="">Tất cả phòng ban</option>' + state.depts.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    ['emp-dept-filter', 'sal-dept-filter'].forEach((id) => { const el = $(id); if (el) { const v = el.value; el.innerHTML = opts; el.value = v; } });
  }

  /* ===================== ĐIỀU HƯỚNG ===================== */
  function navigate(page, el) {
    const navEl = el || document.querySelector(`#sidebar .nav-item[data-page="${page}"]`);
    if (navEl) {
      const allowed = (navEl.getAttribute('data-roles') || '').split(',').map((s) => s.trim());
      if (!allowed.includes(role())) return; // chặn truy cập trang ngoài quyền
    }
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const pg = $('page-' + page);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('#sidebar .nav-item').forEach((n) => n.classList.remove('active'));
    if (navEl) navEl.classList.add('active');
    $('header-title').textContent = PAGE_TITLES[page] || 'HRPro';
    if (HR.pages[page]) HR.pages[page]();
  }
  // Vẽ lại trang đang mở (sau khi CRUD xong)
  function refresh() {
    applyRolePermissions();
    const active = document.querySelector('.page.active');
    if (active && HR.pages[active.id.replace('page-', '')]) HR.pages[active.id.replace('page-', '')]();
  }
  function switchTab(el, paneId) {
    el.parentElement.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    el.classList.add('active');
    const wrap = el.closest('.page');
    wrap.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
    wrap.querySelector('#' + paneId).classList.add('active');
    if (paneId === 'tab-cards' && window.renderEmployeeCards) window.renderEmployeeCards();
  }
  function handleGlobalSearch(v) {
    const inp = $('emp-search');
    if (inp) inp.value = v;
    navigate('employees', document.querySelector('#sidebar .nav-item[data-page="employees"]'));
  }

  /* ===================== BIỂU ĐỒ (HTML/CSS + SVG thuần) ===================== */
  function renderBarChart(el, data, opts = {}) {
    if (!el) return;
    if (!data.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px">Chưa có dữ liệu</div>'; return; }
    const maxVal = Math.max(1, ...data.map((d) => Number(d.value) || 0));
    const wrapHeight = el.clientHeight || parseInt(el.style.height, 10) || opts.maxH || 150;
    const maxBarHeight = Math.max(50, wrapHeight - 42);
    el.innerHTML = data.map((d, i) => {
      const value = Number(d.value) || 0;
      const height = Math.max(8, Math.round((value / maxVal) * maxBarHeight));
      const showValue = opts.fmtValue ? opts.fmtValue(value) : (d.sub || value);
      const click = opts.clickable ? `onclick="${opts.onClick}(${i})"` : '';
      return `<div class="bar-col" title="${esc(d.label)}: ${esc(showValue)}">
        <div class="bar-value">${esc(showValue)}</div>
        <div class="bar" style="height:${height}px;background:${d.color || avColor(i)}" ${click}></div>
        <div class="bar-label">${esc(d.label)}</div></div>`;
    }).join('');
  }
  function renderDonut(svg, legend, data) {
    if (!svg) return;
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    const R = 50; const C = 2 * Math.PI * R; let off = 0;
    svg.innerHTML = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="#eef2f7" stroke-width="16"/>` +
      data.map((d, i) => {
        const len = (d.value / total) * C;
        const c = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${d.color || avColor(i)}" stroke-width="16"
          stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;
        off += len; return c;
      }).join('') +
      `<text x="60" y="58" text-anchor="middle" font-size="20" font-weight="700" fill="#1e293b">${data.reduce((a, d) => a + d.value, 0)}</text>
       <text x="60" y="74" text-anchor="middle" font-size="9" fill="#94a3b8">nhân viên</text>`;
    if (legend) {
      legend.innerHTML = data.map((d, i) => `<div class="legend-item"><span class="legend-dot" style="background:${d.color || avColor(i)}"></span>${esc(d.label)} <strong>${d.value}</strong></div>`).join('');
    }
  }

  /* ===================== XUẤT CSV (tạo file ngay trên trình duyệt) ===================== */
  function downloadCSV(filename, rows) {
    const csv = rows.map((r) => r.map((cell) => {
      const s = String(cell == null ? '' : cell);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  /* ===================== XUẤT RA NAMESPACE + HÀM GỌI TỪ HTML ===================== */
  Object.assign(HR, {
    AVC, ROLES, PAGE_TITLES, $, pad, todayStr, curMonth, dateOnly, fmt, fmtScore, esc, initials, avColor, selectValues, setSelectValues,
    role, can, isSelf, applyRolePermissions, empById, deptById, shiftById, deptColor,
    statusBadge, kpiBadge, empAvatar, deptTag, shiftChips, empCell, openModal, closeModal, busy, run, loadRefs, fillDeptFilters,
    navigate, refresh, renderBarChart, renderDonut, downloadCSV,
  });
  // Các hàm được gọi trực tiếp từ thuộc tính onclick=... trong index.html
  Object.assign(window, { navigate, switchTab, handleGlobalSearch, openModal, closeModal, closeModalOnOverlay });
})();
