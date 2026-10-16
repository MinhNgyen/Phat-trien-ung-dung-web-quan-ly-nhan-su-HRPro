/**
 * kpi.js — Trang Hiệu suất & KPI, nạp THEO KỲ (YYYY-MM).
 * Điểm tổng (total) do BACKEND tính theo trọng số; client chỉ hiển thị và xem trước khi nhập.
 * Bản ghi KPI: { id, employeeId, period, sales, attendance, task, deadline, quality, total, evaluatedBy, employee }
 */
(function () {
  'use strict';
  const { state, $, esc, can, run, isSelf, curMonth, fmtScore, avColor, empById, empAvatar, empCell, deptTag, deptColor,
    openModal, closeModal, downloadCSV } = HR;

  // Trọng số khớp với backend (kpi.controller.js)
  const CRITERIA = [
    { key: 'sales', label: 'Doanh số / kết quả', weight: 0.25 },
    { key: 'attendance', label: 'Chuyên cần', weight: 0.20 },
    { key: 'task', label: 'Hoàn thành công việc', weight: 0.25 },
    { key: 'deadline', label: 'Đúng deadline', weight: 0.15 },
    { key: 'quality', label: 'Chất lượng', weight: 0.15 },
  ];
  let records = [];   // KPI của kỳ đang xem
  let ranked = [];    // [{ e: nhân viên, rec: bản ghi KPI hoặc null }] đã sắp xếp theo điểm
  let seq = 0;

  const rankOf = (s) => (s >= 90 ? { lbl: 'Xuất sắc', cls: 'badge-success' } : s >= 80 ? { lbl: 'Tốt', cls: 'badge-info' }
    : s >= 70 ? { lbl: 'Khá', cls: 'badge-warning' } : { lbl: 'Cần cải thiện', cls: 'badge-danger' });

  // 12 kỳ gần nhất (backend chưa có API liệt kê kỳ)
  function periods() {
    const out = []; const d = new Date(); d.setDate(1);
    for (let i = 0; i < 12; i++) { out.push(`${d.getFullYear()}-${HR.pad(d.getMonth() + 1)}`); d.setMonth(d.getMonth() - 1); }
    return out;
  }
  const curPeriod = () => ($('kpi-period') && $('kpi-period').value) || curMonth();

  async function renderPerformance() {
    const sel = $('kpi-period');
    if (!sel.options.length) { sel.innerHTML = periods().map((p) => `<option>${p}</option>`).join(''); sel.value = curMonth(); }
    const period = curPeriod();
    const mine = ++seq;
    await run(async () => {
      const data = isSelf()
        ? (await window.API.getKPIByEmployee(state.me.employeeId)).filter((k) => k.period === period)
        : await window.API.getKPI({ period });
      if (mine !== seq) return;
      records = data;
      draw(period);
    }, 'Không tải được dữ liệu KPI.');
  }

  function draw(period) {
    const byEmp = {}; records.forEach((k) => { byEmp[k.employeeId] = k; });
    // Mọi nhân viên trong phạm vi xem; người chưa được chấm KPI xếp cuối
    ranked = state.emps.map((e) => ({ e, rec: byEmp[e.id] || null }))
      .sort((a, b) => (b.rec ? b.rec.total : -1) - (a.rec ? a.rec.total : -1));

    // KPI trung bình theo phòng ban (chỉ tính người đã có điểm)
    const byDept = {};
    ranked.filter((r) => r.rec).forEach((r) => { const n = r.e.department ? r.e.department.name : 'Chưa có'; (byDept[n] = byDept[n] || { sum: 0, c: 0, color: deptColor(r.e.department) }); byDept[n].sum += r.rec.total; byDept[n].c++; });
    $('kpi-dept-bars').innerHTML = Object.keys(byDept).map((n) => {
      const avg = Math.round(byDept[n].sum / byDept[n].c);
      return `<div class="kpi-bar-row"><div class="kpi-bar-lbl">${esc(n)}</div>
        <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${avg}%;background:${byDept[n].color}"></div></div>
        <div class="kpi-bar-val">${avg}</div></div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Chưa có dữ liệu KPI kỳ này</div>';

    $('kpi-top3').innerHTML = ranked.filter((r) => r.rec).slice(0, 3).map((r, i) => `<div class="top3-row">
      <div class="top3-medal">${['🥇', '🥈', '🥉'][i]}</div>${empAvatar(r.e)}
      <div style="flex:1"><div class="emp-name">${esc(r.e.name)}</div><div class="emp-sub">${esc(r.e.department ? r.e.department.name : '')}</div></div>
      <div class="top3-score">${fmtScore(r.rec.total)}</div></div>`).join('') || '<div style="color:var(--text-muted);font-size:13px">Chưa có dữ liệu</div>';

    const canEval = can('admin,hr,manager');
    $('kpi-tbody').innerHTML = ranked.map((r, i) => {
      const k = r.rec ? r.rec.total : null;
      const rk = k == null ? null : rankOf(k);
      return `<tr><td>${i + 1}</td><td>${empCell(r.e)}</td><td>${deptTag(r.e.department)}</td>
        <td><strong>${k == null ? '—' : fmtScore(k)}</strong></td>
        <td><div class="kpi-bar-track" style="width:90px"><div class="kpi-bar-fill" style="width:${k || 0}%;background:${k >= 80 ? 'var(--success)' : k >= 70 ? 'var(--warning)' : 'var(--danger)'}"></div></div></td>
        <td>${rk ? `<span class="badge ${rk.cls}">${rk.lbl}</span>` : '<span class="badge badge-gray">Chưa chấm</span>'}</td>
        <td style="font-size:12.5px;color:var(--text-muted)">${esc((r.rec && r.rec.evaluatedBy) || '—')}</td>
        ${canEval ? `<td><button class="icon-btn" title="Chấm KPI" onclick="openKpiModal(${r.e.id})">📝</button></td>` : '<td></td>'}</tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">Chưa có nhân viên</td></tr>';
    void period;
  }

  /* ---------- Modal chấm KPI ---------- */
  function openKpiModal(empId) {
    if (!can('admin,hr,manager')) return;
    const e = empById(empId);
    if (!e) return;
    const period = curPeriod();
    const existing = records.find((k) => k.employeeId === e.id);
    $('kpi-modal-title').textContent = '🎯 Đánh giá KPI – ' + e.name + ' (' + period + ')';
    $('k-emp-id').value = e.id;
    $('k-criteria').innerHTML = CRITERIA.map((c) => `<div class="form-group">
      <label class="form-label">${c.label} <span style="color:var(--text-muted);font-weight:400">(trọng số ${Math.round(c.weight * 100)}%)</span></label>
      <input class="form-control kpi-input" data-key="${c.key}" data-weight="${c.weight}" type="number" min="0" max="100" value="${existing ? existing[c.key] : 0}" oninput="recalcKpiTotal()"></div>`).join('');
    recalcKpiTotal();
    openModal('kpi-modal');
  }
  const clamp = (v) => Math.max(0, Math.min(100, parseFloat(v) || 0));
  function recalcKpiTotal() {
    let total = 0;
    document.querySelectorAll('#k-criteria .kpi-input').forEach((i) => { total += clamp(i.value) * parseFloat(i.dataset.weight); });
    $('k-total').textContent = fmtScore(total); // chỉ xem trước; điểm chính thức do backend tính
  }

  async function saveKpi() {
    if (!can('admin,hr,manager')) return;
    const employeeId = Number($('k-emp-id').value);
    const period = curPeriod();
    const payload = { employeeId, period, evaluatedBy: state.me.name };
    document.querySelectorAll('#k-criteria .kpi-input').forEach((i) => { payload[i.dataset.key] = clamp(i.value); });
    const existing = records.find((k) => k.employeeId === employeeId);
    const ok = await run(async () => {
      if (existing) await window.API.updateKPI(existing.id, payload);
      else await window.API.createKPI(payload);
      await HR.loadRefs(); // cập nhật điểm KPI hiển thị ở trang nhân viên / phòng ban
      return true;
    }, 'Không lưu được KPI.');
    if (ok) { closeModal('kpi-modal'); renderPerformance(); }
  }

  function exportKpiCSV() {
    const period = curPeriod();
    const out = [['Hạng', 'Mã NV', 'Họ tên', 'Phòng ban', 'Điểm KPI', 'Xếp loại', 'Người đánh giá']];
    ranked.forEach((r, i) => out.push([i + 1, r.e.employeeCode, r.e.name, r.e.department ? r.e.department.name : '',
      r.rec ? r.rec.total : '', r.rec ? rankOf(r.rec.total).lbl : 'Chưa chấm', (r.rec && r.rec.evaluatedBy) || '']));
    downloadCSV('bao_cao_kpi_' + period + '.csv', out);
  }

  void avColor;
  HR.pages.performance = renderPerformance;
  Object.assign(window, { renderPerformance, openKpiModal, recalcKpiTotal, saveKpi, exportKpiCSV });
})();
