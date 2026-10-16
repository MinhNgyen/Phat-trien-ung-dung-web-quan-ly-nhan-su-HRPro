/**
 * employees.js — Trang Nhân viên: bảng, thẻ, thêm/sửa/xóa, phân ca, xuất CSV.
 * Nhân viên lấy từ API: { id, employeeCode, name, email, phone, position, salary, joinedAt,
 *                         status, department:{id,name,color}, shifts:[{id,name,startTime,endTime,isPrimary}] }
 */
(function () {
  'use strict';
  const { state, $, esc, fmt, can, run, empById, empCell, empAvatar, deptTag, statusBadge, kpiBadge, shiftChips,
    selectValues, setSelectValues, openModal, closeModal, dateOnly, todayStr, downloadCSV } = HR;

  const kpiOf = (e) => state.kpiCur[e.id]; // KPI kỳ hiện tại (có thể chưa có)

  // Áp dụng 3 bộ lọc: ô tìm kiếm, phòng ban, trạng thái
  function filtered() {
    const q = (($('emp-search') || {}).value || '').toLowerCase().trim();
    const dept = ($('emp-dept-filter') || {}).value || '';
    const st = ($('emp-status-filter') || {}).value || '';
    return state.emps.filter((e) => {
      if (dept && String(e.department ? e.department.id : '') !== dept) return false;
      if (st && e.status !== st) return false;
      if (q && !(e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || (e.position || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }

  function renderEmployeeTable() {
    HR.fillDeptFilters();
    const list = filtered();
    $('emp-count-lbl').textContent = state.emps.length + ' nhân viên';
    const canEdit = can('admin,hr');
    $('emp-table-body').innerHTML = list.length ? list.map((e) => `<tr>
      <td><strong>${esc(e.employeeCode)}</strong></td>
      <td><div class="emp-cell">${empAvatar(e)}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.email || '')}</div></div></div></td>
      <td>${esc(e.position || '')}</td>
      <td>${deptTag(e.department)}</td>
      <td><div class="shift-chip-list">${shiftChips(e)}</div></td>
      <td>${esc(dateOnly(e.joinedAt))}</td><td>${fmt(e.salary)}</td><td>${kpiBadge(kpiOf(e))}</td><td>${statusBadge(e.status)}</td>
      <td>${canEdit ? `<button class="icon-btn" title="Sửa" onclick="openEditModal(${e.id})">✏️</button>
        <button class="icon-btn" title="Xóa" onclick="deleteEmp(${e.id})">🗑️</button>` : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
    </tr>`).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:30px">Không có nhân viên phù hợp</td></tr>';
  }

  function renderEmployeeCards() {
    const grid = $('emp-cards-grid');
    if (!grid) return;
    grid.innerHTML = filtered().map((e) => `<div class="emp-card">
      <div class="emp-card-top">${empAvatar(e)}<div><div class="emp-name">${esc(e.name)}</div><div class="emp-sub">${esc(e.position || '')}</div></div></div>
      <div class="emp-card-body">
        <div class="ec-row"><span>Mã NV</span><strong>${esc(e.employeeCode)}</strong></div>
        <div class="ec-row"><span>Phòng ban</span>${deptTag(e.department)}</div>
        <div class="ec-row"><span>Ca làm</span><div class="shift-chip-list">${shiftChips(e)}</div></div>
        <div class="ec-row"><span>Lương CB</span><strong>${fmt(e.salary)}</strong></div>
        <div class="ec-row"><span>KPI</span>${kpiBadge(kpiOf(e))}</div>
        <div class="ec-row"><span>Trạng thái</span>${statusBadge(e.status)}</div>
      </div></div>`).join('');
  }

  /* ---------- Modal thêm / sửa ---------- */
  function fillEmpSelects() {
    $('f-dept').innerHTML = '<option value="">— Chọn phòng ban —</option>' + state.depts.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    $('f-shift').innerHTML = state.shifts.map((s) => `<option value="${s.id}">${esc(s.name)} (${esc(s.startTime)}–${esc(s.endTime)})</option>`).join('');
  }

  function openAddModal() {
    if (!can('admin,hr')) return;
    fillEmpSelects();
    $('emp-modal-title').textContent = '👤 Thêm nhân viên mới';
    $('f-edit-id').value = '';
    ['f-name', 'f-email', 'f-phone', 'f-pos', 'f-salary'].forEach((id) => { $(id).value = ''; });
    $('f-joined').value = todayStr();
    // gợi ý mã nhân viên kế tiếp: NV + (số lớn nhất hiện có + 1)
    const maxN = state.emps.reduce((m, e) => Math.max(m, parseInt((e.employeeCode || '').replace(/\D/g, ''), 10) || 0), 0);
    $('f-id').value = 'NV' + String(maxN + 1).padStart(3, '0');
    $('f-id').readOnly = false;
    $('f-status').value = 'ACTIVE';
    setSelectValues($('f-shift'), state.shifts[0] ? [state.shifts[0].id] : []);
    openModal('emp-modal');
  }

  function openEditModal(id) {
    if (!can('admin,hr')) return;
    const e = empById(id);
    if (!e) return;
    fillEmpSelects();
    $('emp-modal-title').textContent = '✏️ Sửa thông tin nhân viên';
    $('f-edit-id').value = e.id;
    $('f-name').value = e.name;
    $('f-id').value = e.employeeCode; $('f-id').readOnly = true;
    $('f-email').value = e.email || '';
    $('f-phone').value = e.phone || '';
    $('f-dept').value = e.department ? e.department.id : '';
    $('f-pos').value = e.position || '';
    $('f-joined').value = dateOnly(e.joinedAt);
    $('f-salary').value = e.salary;
    $('f-status').value = e.status;
    setSelectValues($('f-shift'), (e.shifts || []).map((s) => s.id));
    openModal('emp-modal');
  }

  /**
   * Đồng bộ ca làm lên server: so ca hiện có với danh sách ca được chọn trên form,
   * chỉ gọi gỡ/gán cho phần chênh lệch. Nếu chưa có ca chính thì ca mới đầu tiên là ca chính.
   */
  async function syncShifts(empId, wantedIds) {
    const want = [...new Set(wantedIds)];
    const current = await window.API.getEmployeeShifts(empId); // [{shiftId, isPrimary, shift}]
    for (const row of current) {
      if (!want.includes(row.shiftId)) await window.API.unassignShift(empId, row.shiftId);
    }
    let hasPrimary = current.some((r) => want.includes(r.shiftId) && r.isPrimary);
    for (const sid of want) {
      if (!current.some((r) => r.shiftId === sid)) {
        await window.API.assignShift(empId, sid, !hasPrimary);
        hasPrimary = true;
      }
    }
  }

  async function saveEmployee() {
    const editId = $('f-edit-id').value;
    const name = $('f-name').value.trim();
    const code = $('f-id').value.trim();
    const email = $('f-email').value.trim();
    const salary = parseInt($('f-salary').value, 10) || 0;
    const deptId = $('f-dept').value;
    const shiftIds = selectValues($('f-shift')).map(Number);
    if (!name) { alert('Vui lòng nhập họ tên'); return; }
    if (!code) { alert('Vui lòng nhập mã nhân viên'); return; }
    if (!email) { alert('Vui lòng nhập email (bắt buộc, dùng để tránh trùng nhân viên)'); return; }
    if (!deptId) { alert('Vui lòng chọn phòng ban'); return; }
    if (!shiftIds.length) { alert('Vui lòng chọn ít nhất một ca làm việc'); return; }
    if (salary < 1000000) { alert('Lương cơ bản không hợp lệ (tối thiểu 1.000.000đ)'); return; }
    if (state.emps.some((e) => e.employeeCode === code && String(e.id) !== editId)) { alert('Mã nhân viên "' + code + '" đã tồn tại!'); return; }
    if (state.emps.some((e) => e.email === email && String(e.id) !== editId)) { alert('Email này đã được dùng bởi nhân viên khác'); return; }

    const payload = {
      employeeCode: code, name, email,
      phone: $('f-phone').value.trim() || null,
      position: $('f-pos').value.trim() || null,
      joinedAt: $('f-joined').value || todayStr(),
      salary, status: $('f-status').value, departmentId: Number(deptId),
    };
    const ok = await run(async () => {
      let id;
      if (editId) { id = Number(editId); await window.API.updateEmployee(id, payload); }
      else { id = (await window.API.createEmployee(payload)).id; }
      await syncShifts(id, shiftIds);
      await HR.loadRefs();
      return true;
    }, 'Không lưu được nhân viên.');
    if (ok) { closeModal('emp-modal'); HR.refresh(); }
  }

  async function deleteEmp(id) {
    if (!can('admin,hr')) return;
    const e = empById(id);
    if (!e || !confirm('Xóa nhân viên ' + e.name + ' (' + e.employeeCode + ')?')) return;
    const ok = await run(async () => { await window.API.deleteEmployee(e.id); await HR.loadRefs(); return true; }, 'Không xóa được nhân viên.');
    if (ok) HR.refresh();
  }

  function exportEmployeesCSV() {
    const rows = [['Mã NV', 'Họ tên', 'Chức vụ', 'Phòng ban', 'Ngày vào', 'Lương CB', 'KPI kỳ này', 'Ca làm', 'Email', 'Điện thoại', 'Trạng thái']];
    state.emps.forEach((e) => rows.push([e.employeeCode, e.name, e.position || '', e.department ? e.department.name : '', dateOnly(e.joinedAt), e.salary,
      kpiOf(e) == null ? '' : kpiOf(e), (e.shifts || []).map((s) => s.name).join(', '), e.email || '', e.phone || '',
      { ACTIVE: 'Đang làm', LEAVE: 'Nghỉ phép', INACTIVE: 'Đã nghỉ việc' }[e.status] || e.status]));
    downloadCSV('danh_sach_nhan_vien.csv', rows);
  }

  HR.pages.employees = renderEmployeeTable;
  Object.assign(window, { renderEmployeeTable, renderEmployeeCards, openAddModal, openEditModal, saveEmployee, deleteEmp, exportEmployeesCSV });
})();
