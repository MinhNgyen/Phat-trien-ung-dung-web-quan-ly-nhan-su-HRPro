/**
 * shifts.js — Trang Ca làm việc.
 * Ca từ API: { id, code, name, startTime, endTime, graceMinutes, overtimeRate, employeeCount }
 */
(function () {
  'use strict';
  const { state, $, esc, can, run, avColor, openModal, closeModal, renderBarChart } = HR;

  // Cột có thể chưa tồn tại nếu database chưa cập nhật -> dùng giá trị mặc định
  const graceOf = (s) => (s.graceMinutes != null ? s.graceMinutes : 10);
  const otOf = (s) => (s.overtimeRate != null ? Number(s.overtimeRate) : 1.5);

  function renderShifts() {
    const canEdit = can('admin,hr');
    $('shift-tbody').innerHTML = state.shifts.map((s) => `<tr>
      <td><strong>${esc(s.code)}</strong></td><td>${esc(s.name)}</td>
      <td>${esc(s.startTime)}</td><td>${esc(s.endTime)}</td>
      <td>${graceOf(s)} phút</td><td>×${otOf(s)}</td><td>${s.employeeCount || 0}</td>
      <td>${canEdit ? `<button class="icon-btn" onclick="openShiftModal(${s.id})">✏️</button>
        <button class="icon-btn" onclick="deleteShift(${s.id})">🗑️</button>` : '—'}</td>
    </tr>`).join('');
    renderBarChart($('chart-shift'), state.shifts.map((s, i) => ({ label: s.name, value: s.employeeCount || 0, color: avColor(i) })));
  }

  function openShiftModal(id) {
    if (!can('admin,hr')) return;
    const s = id ? state.shifts.find((x) => x.id === Number(id)) : null;
    if (s) {
      $('shift-modal-title').textContent = '✏️ Sửa ca làm việc';
      $('s-edit-name').value = s.id;
      $('s-code').value = s.code; $('s-code').readOnly = true;
      $('s-name').value = s.name;
      $('s-start').value = s.startTime; $('s-end').value = s.endTime;
      $('s-grace').value = graceOf(s); $('s-ot').value = otOf(s);
    } else {
      $('shift-modal-title').textContent = '📅 Thêm ca làm việc';
      $('s-edit-name').value = '';
      $('s-code').value = ''; $('s-code').readOnly = false;
      $('s-name').value = '';
      $('s-start').value = '08:00'; $('s-end').value = '17:00';
      $('s-grace').value = '10'; $('s-ot').value = '1.5';
    }
    openModal('shift-modal');
  }

  async function saveShift() {
    const editId = $('s-edit-name').value;
    const code = $('s-code').value.trim();
    const name = $('s-name').value.trim();
    if (!code || !name) { alert('Nhập mã và tên ca'); return; }
    if (state.shifts.some((s) => s.code === code && String(s.id) !== editId)) { alert('Mã ca đã tồn tại'); return; }
    const payload = {
      code, name, startTime: $('s-start').value, endTime: $('s-end').value,
      graceMinutes: parseInt($('s-grace').value, 10) || 0,
      overtimeRate: parseFloat($('s-ot').value) || 1,
    };
    const ok = await run(async () => {
      if (editId) await window.API.updateShift(Number(editId), payload);
      else await window.API.createShift(payload);
      await HR.loadRefs();
      return true;
    }, 'Không lưu được ca làm việc.');
    if (ok) { closeModal('shift-modal'); HR.refresh(); }
  }

  // Xóa ca -> backend tự gỡ phân ca liên quan (cascade)
  async function deleteShift(id) {
    if (!can('admin,hr')) return;
    const s = state.shifts.find((x) => x.id === Number(id));
    if (!s) return;
    const warn = s.employeeCount ? `Ca này đang được ${s.employeeCount} nhân viên sử dụng, xóa sẽ gỡ phân ca của họ. ` : '';
    if (!confirm(warn + 'Xóa ca ' + s.name + '?')) return;
    const ok = await run(async () => { await window.API.deleteShift(s.id); await HR.loadRefs(); return true; }, 'Không xóa được ca làm việc.');
    if (ok) HR.refresh();
  }

  // Dùng chung cho module chấm công (grace của ca)
  HR.shiftGrace = graceOf;
  HR.pages.shifts = renderShifts;
  Object.assign(window, { renderShifts, openShiftModal, saveShift, deleteShift });
})();
