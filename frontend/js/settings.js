/**
 * settings.js — Trang Cài đặt: cấu hình lương (GET/PUT /api/settings/payroll) và danh sách tài khoản (GET /api/auth/users).
 */
(function () {
  'use strict';
  const { state, $, esc, can, run, ROLES } = HR;

  // id ô nhập trên giao diện -> tên field của backend
  const FIELDS = {
    'set-lunch': 'lunch', 'set-fuel': 'fuel', 'set-phone-allow': 'phoneAllow', 'set-ot': 'ot', 'set-bhxh': 'bhxh', 'set-bhyt': 'bhyt',
    'set-bhtn': 'bhtn', 'set-personal-relief': 'personalRelief', 'set-standard-days': 'standardDays', 'set-late-penalty': 'latePenalty',
  };

  async function renderSettings() {
    $('setting-size').value = state.emps.length + ' nhân viên';
    await run(async () => {
      const s = await window.API.getPayrollSettings();
      state.company = s.company || '';
      $('set-company').value = s.company || ''; $('set-email').value = s.email || '';
      Object.keys(FIELDS).forEach((id) => { $(id).value = s[FIELDS[id]]; });
      if (can('admin')) {
        const users = await window.API.getUsers();
        $('users-tbody').innerHTML = users.map((u) => {
          const r = ROLES[String(u.role).toLowerCase()] || { label: u.role, scope: '' };
          return `<tr><td><strong>${esc(u.username)}</strong></td><td>${esc(u.fullName || '')}</td>
            <td><span class="badge badge-info">${esc(r.label)}</span></td>
            <td style="font-size:12.5px;color:var(--text-muted)">${esc(r.scope)}</td></tr>`;
        }).join('');
      }
    }, 'Không tải được cấu hình.');
  }

  async function saveSettings() {
    if (!can('admin,accountant')) return;
    const payload = { company: $('set-company').value.trim() || null, email: $('set-email').value.trim() };
    for (const id of Object.keys(FIELDS)) {
      const v = parseFloat($(id).value);
      if (Number.isNaN(v)) { alert('Vui lòng nhập đủ các giá trị số trong cấu hình lương'); return; }
      payload[FIELDS[id]] = v;
    }
    const ok = await run(async () => { state.company = (await window.API.updatePayrollSettings(payload)).company || ''; return true; }, 'Không lưu được cấu hình.');
    if (ok) alert('✓ Đã lưu cấu hình. Áp dụng từ lần tính lương tiếp theo (bảng lương đã tính trước đó giữ nguyên).');
  }

  HR.pages.settings = renderSettings;
  Object.assign(window, { renderSettings, saveSettings });
})();
