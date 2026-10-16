/**
 * departments.js — Trang Phòng ban: thẻ thống kê + thêm/sửa/xóa.
 * Phòng ban từ API: { id, code, name, description, head, color, employeeCount }
 */
(function () {
  'use strict';
  const { state, $, esc, fmt, fmtScore, can, run, openModal, closeModal } = HR;

  // Thống kê phòng ban tính từ danh sách nhân viên trong cache
  function statsOf(d) {
    const list = state.emps.filter((e) => e.department && e.department.id === d.id);
    const kpis = list.map((e) => state.kpiCur[e.id]).filter((k) => k != null);
    return {
      count: list.length,
      salarySum: list.reduce((a, e) => a + e.salary, 0),
      avgKpi: kpis.length ? kpis.reduce((a, b) => a + b, 0) / kpis.length : 0,
    };
  }

  function renderDepartments() {
    const canEdit = can('admin,hr');
    $('dept-cards').innerHTML = state.depts.map((d) => {
      const st = statsOf(d);
      const color = d.color || '#3b82f6';
      return `<div class="card dept-detail-card" style="border-top:3px solid ${color}"><div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div><div class="dept-badge" style="background:${color}">${esc(d.code)}</div>
            <h3 style="margin:10px 0 2px">${esc(d.name)}</h3>
            <p style="font-size:12.5px;color:var(--text-muted);margin:0">${esc(d.description || '')}</p></div>
          ${canEdit ? `<div style="display:flex;gap:4px"><button class="icon-btn" onclick="openDeptModal(${d.id})">✏️</button>
            <button class="icon-btn" onclick="deleteDept(${d.id})">🗑️</button></div>` : ''}
        </div>
        <div class="dept-stats">
          <div><div class="ds-num">${st.count}</div><div class="ds-lbl">Nhân viên</div></div>
          <div><div class="ds-num">${st.avgKpi ? fmtScore(st.avgKpi) : '—'}</div><div class="ds-lbl">KPI TB</div></div>
          <div><div class="ds-num">${fmt(st.salarySum / 1e6)}tr</div><div class="ds-lbl">Quỹ lương</div></div>
        </div>
        <div style="margin-top:12px;font-size:13px"><span style="color:var(--text-muted)">Trưởng phòng:</span> <strong>${esc(d.head || '—')}</strong></div>
      </div></div>`;
    }).join('') || '<div style="color:var(--text-muted);padding:20px">Chưa có phòng ban nào</div>';
  }

  function openDeptModal(id) {
    if (!can('admin,hr')) return;
    $('d-head').innerHTML = '<option value="">—</option>' + state.emps.map((e) => `<option>${esc(e.name)}</option>`).join('');
    const d = id ? state.depts.find((x) => x.id === Number(id)) : null;
    if (d) {
      $('dept-modal-title').textContent = '✏️ Sửa phòng ban';
      $('d-edit-name').value = d.id;
      $('d-code').value = d.code; $('d-code').readOnly = true;
      $('d-name').value = d.name;
      $('d-head').value = d.head || '';
      $('d-desc').value = d.description || '';
      $('d-color').value = d.color || '#3b82f6';
    } else {
      $('dept-modal-title').textContent = '🏢 Thêm phòng ban';
      $('d-edit-name').value = '';
      ['d-code', 'd-name', 'd-desc'].forEach((i) => { $(i).value = ''; });
      $('d-code').readOnly = false;
      $('d-head').value = '';
      $('d-color').value = '#3b82f6';
    }
    openModal('dept-modal');
  }

  async function saveDept() {
    const editId = $('d-edit-name').value;
    const code = $('d-code').value.trim();
    const name = $('d-name').value.trim();
    if (!code || !name) { alert('Nhập mã và tên phòng ban'); return; }
    if (state.depts.some((d) => d.code === code && String(d.id) !== editId)) { alert('Mã phòng ban đã tồn tại'); return; }
    const payload = { code, name, head: $('d-head').value || null, description: $('d-desc').value.trim() || null, color: $('d-color').value };
    const ok = await run(async () => {
      if (editId) await window.API.updateDepartment(Number(editId), payload);
      else await window.API.createDepartment(payload);
      await HR.loadRefs();
      return true;
    }, 'Không lưu được phòng ban.');
    if (ok) { closeModal('dept-modal'); HR.refresh(); }
  }

  // Backend tự chặn (409) nếu phòng ban còn nhân viên
  async function deleteDept(id) {
    if (!can('admin,hr')) return;
    const d = state.depts.find((x) => x.id === Number(id));
    if (!d || !confirm('Xóa phòng ban ' + d.name + '?')) return;
    const ok = await run(async () => { await window.API.deleteDepartment(d.id); await HR.loadRefs(); return true; }, 'Không xóa được phòng ban.');
    if (ok) HR.refresh();
  }

  HR.pages.departments = renderDepartments;
  Object.assign(window, { renderDepartments, openDeptModal, saveDept, deleteDept });
})();
