/**
 * auth.js — Đăng nhập / đăng xuất / khôi phục phiên khi tải lại trang.
 * Token JWT do api.js lưu trong localStorage; ở đây chỉ giữ thông tin người dùng trong HR.state.me.
 */
(function () {
  'use strict';
  const { state, $, esc, run, initials, ROLES } = HR;

  // Tài khoản demo (đã seed trong backend/prisma/seed.js) — chỉ để hiển thị gợi ý
  const DEMO = [['admin', 'admin123', 'admin'], ['hr', 'hr123456', 'hr'], ['ketoan', 'ketoan123', 'accountant'], ['nhanvien', 'nhanvien123', 'employee']];

  // user từ API (/auth/login hoặc /auth/me) -> state.me
  function setMe(user) {
    state.me = {
      userId: user.id,
      username: user.username,
      name: user.fullName || user.username,
      role: String(user.role || '').toLowerCase(), // ADMIN -> admin, khớp data-roles trong HTML
      employeeId: user.employee ? user.employee.id : null,
      employeeCode: user.employee ? user.employee.employeeCode : null,
    };
  }

  function showLogin(msg) {
    state.me = null;
    $('app-shell').style.display = 'none';
    $('login-screen').style.display = 'flex';
    $('login-pass').value = '';
    $('login-error').textContent = msg || '';
  }

  // Hiện khung ứng dụng, nạp dữ liệu danh mục rồi mở trang đầu tiên mà vai trò được phép xem
  async function enterApp() {
    const me = state.me;
    $('login-screen').style.display = 'none';
    $('app-shell').style.display = 'flex';
    $('user-name').textContent = me.name;
    $('user-role').textContent = (ROLES[me.role] || {}).label || me.role;
    $('user-avatar').textContent = initials(me.name);
    HR.applyRolePermissions();
    const ok = await run(() => HR.loadRefs(), 'Không tải được dữ liệu từ máy chủ.');
    if (!ok) return;
    const first = document.querySelector('#sidebar .nav-item:not([style*="display: none"])');
    if (first) HR.navigate(first.getAttribute('data-page'), first);
  }

  async function doLogin() {
    const username = $('login-user').value.trim();
    const password = $('login-pass').value;
    const errEl = $('login-error');
    errEl.textContent = '';
    if (!username || !password) { errEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }
    const btn = document.querySelector('#login-screen .btn-primary');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Đang đăng nhập...'; }
    try {
      const data = await window.API.login(username, password);
      setMe(data.user);
      await enterApp();
    } catch (err) {
      errEl.textContent = err.message || 'Sai tên đăng nhập hoặc mật khẩu.';
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Đăng nhập'; }
    }
  }

  function doLogout() {
    window.API.logout();
    showLogin();
  }

  // Khởi động: nếu còn token hợp lệ thì vào thẳng ứng dụng (F5 không phải đăng nhập lại)
  async function init() {
    $('login-hint').innerHTML = '<strong>Tài khoản demo:</strong><br>' +
      DEMO.map(([u, p, r]) => `${esc(u)} / ${esc(p)} — ${ROLES[r].label}`).join('<br>');
    $('att-date').value = HR.todayStr();
    $('sal-month').value = HR.curMonth();
    if (window.API.isLoggedIn()) {
      try {
        setMe(await window.API.getMe());
        await enterApp();
        return;
      } catch (err) { console.warn('Phiên đăng nhập cũ không còn hiệu lực', err); }
    }
    showLogin();
  }

  HR.showLogin = showLogin;
  Object.assign(window, { doLogin, doLogout });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
