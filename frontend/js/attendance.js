/**
 * attendance.js — Trang Chấm công.
 * Dữ liệu nạp THEO NGÀY đang xem (không tải toàn bộ lịch sử). Trạng thái, giờ làm, số phút đi muộn
 * do backend tính sẵn; client chỉ tính "về sớm" để hiển thị và để xem trước trong form.
 * Bản ghi: { id, employeeId, shiftId, date, checkIn, checkOut, workHours, lateMinutes, status, type, note, employee, shift }
 */
(function () {
  'use strict';
  const { state, $, esc, can, run, isSelf, empById, shiftById, empCell, deptTag, openModal, closeModal,
    todayStr, downloadCSV, empAvatar } = HR;

  const ATT_STATUS = {
    PRESENT: { lbl: 'Đúng giờ', cls: 'badge-success' },
    LATE: { lbl: 'Muộn / về sớm', cls: 'badge-warning' },
    ABSENT: { lbl: 'Vắng', cls: 'badge-danger' },
    LEAVE: { lbl: 'Nghỉ phép', cls: 'badge-info' },
  };
  let rows = [];   // bản ghi của ngày đang xem (dùng cho bảng, modal chi tiết, CSV)
  let seq = 0;     // chống ghi đè khi người dùng đổi ngày liên tục

  const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const graceOf = (s) => (s && HR.shiftGrace ? HR.shiftGrace(s) : 0);

  // Số phút về sớm so với giờ kết thúc ca (ca đêm qua ngày được xử lý riêng)
  function earlyMinutes(shift, outT) {
    const o = toMin(outT); const s = shift && toMin(shift.startTime); const e = shift && toMin(shift.endTime);
    if (o == null || s == null || e == null) return 0;
    let outAdj = o; let endAdj = e;
    if (e <= s) { endAdj = e + 1440; if (o < s) outAdj = o + 1440; }
    return Math.max(0, endAdj - outAdj);
  }
  // Tính trạng thái từ form — cùng quy tắc với backend, chỉ để XEM TRƯỚC (backend tính lại khi lưu)
  function evaluate(shift, type, inT, outT) {
    if (type === 'leave') return { status: 'LEAVE', late: 0, early: 0, reason: 'Nghỉ phép' };
    if (type === 'absent') return { status: 'ABSENT', late: 0, early: 0, reason: 'Vắng không phép' };
    if (!shift) return { status: 'ABSENT', late: 0, early: 0, reason: 'Chưa phân ca' };
    if (!inT) return { status: 'ABSENT', late: 0, early: 0, reason: 'Chưa có giờ vào' };
    const late = Math.max(0, toMin(inT) - (toMin(shift.startTime) + graceOf(shift)));
    const early = outT ? earlyMinutes(shift, outT) : 0;
    const parts = [];
    if (late > 0) parts.push(`Đi muộn ${late} phút`);
    if (early > 0) parts.push(`Về sớm ${early} phút`);
    return { status: late > 0 || early > 0 ? 'LATE' : 'PRESENT', late, early, reason: parts.join(' · ') || 'Đúng ca' };
  }
  // Diễn giải 1 bản ghi đã lưu
  function metaOf(r) {
    const shift = shiftById(r.shiftId) || r.shift;
    if (r.status === 'LEAVE') return { shift, late: 0, early: 0, reason: 'Nghỉ phép' };
    if (r.status === 'ABSENT') return { shift, late: 0, early: 0, reason: 'Vắng không phép' };
    const late = r.lateMinutes || 0;
    const early = earlyMinutes(shift, r.checkOut);
    const parts = [];
    if (late > 0) parts.push(`Đi muộn ${late} phút`);
    if (early > 0) parts.push(`Về sớm ${early} phút`);
    return { shift, late, early, reason: parts.join(' · ') || 'Đúng ca' };
  }

  function draw(date) {
    let p = 0; let l = 0; let a = 0; let lv = 0;
    const html = rows.map((r) => {
      if (r.status === 'PRESENT') p++; else if (r.status === 'LATE') l++; else if (r.status === 'ABSENT') a++; else if (r.status === 'LEAVE') lv++;
      const st = ATT_STATUS[r.status] || ATT_STATUS.ABSENT;
      const m = metaOf(r);
      const dept = (empById(r.employeeId) || r.employee || {}).department || (r.employee || {}).department;
      return `<tr>
        <td>${empCell(r.employee)}</td>
        <td>${deptTag(dept)}</td>
        <td>${m.shift ? `<strong>${esc(m.shift.name)}</strong><div class="att-sub">${esc(m.shift.startTime)}–${esc(m.shift.endTime)} · cho phép muộn ${graceOf(m.shift)}p</div>` : '<span class="badge badge-gray">Chưa phân ca</span>'}</td>
        <td>${esc(r.checkIn || '—')}</td><td>${esc(r.checkOut || '—')}</td>
        <td><span class="badge ${st.cls}">${st.lbl}</span><div class="att-reason">${esc(m.reason)}</div></td>
        <td style="font-size:12.5px;color:var(--text-muted)">${esc(r.note || '')}</td>
        <td><button class="btn btn-outline btn-xs" onclick="openAttendanceDetail(${r.id})">Chi tiết</button></td></tr>`;
    });
    $('att-p').textContent = p; $('att-l').textContent = l; $('att-a').textContent = a; $('att-lv').textContent = lv;
    $('att-tbody').innerHTML = html.length ? html.join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px">Chưa có bản ghi chấm công trong ngày này</td></tr>';
    if (date === todayStr()) { const lb = $('late-badge'); if (lb) { lb.textContent = l; lb.style.display = l ? '' : 'none'; } }
  }

  async function renderAttendance() {
    const dateEl = $('att-date');
    if (!dateEl.value) dateEl.value = todayStr();
    const date = dateEl.value;
    $('att-date-lbl').textContent = date;
    const mine = ++seq;
    await run(async () => {
      let data;
      if (isSelf()) data = (await window.API.getAttendanceByEmployee(state.me.employeeId, date.slice(0, 7))).filter((r) => r.date === date);
      else data = await window.API.getAttendanceByDate(date);
      if (mine !== seq) return; // đã có yêu cầu mới hơn
      rows = data;
      draw(date);
    }, 'Không tải được dữ liệu chấm công.');
  }

  /* ---------- Modal chấm công thủ công ---------- */
  function fillCheckinShiftSelect() {
    const emp = empById($('ci-emp').value);
    const sel = $('ci-shift');
    if (!emp) return;
    const own = (emp.shifts || []).map((s) => shiftById(s.id) || s);
    const list = own.length ? own : state.shifts;
    sel.innerHTML = list.map((s) => `<option value="${s.id}">${esc(s.name)} (${esc(s.startTime)}–${esc(s.endTime)})</option>`).join('');
    if (list[0]) { sel.value = list[0].id; $('ci-in').value = list[0].startTime; $('ci-out').value = list[0].endTime; }
    toggleCheckinType();
  }
  function openCheckinModal() {
    if (!can('admin,hr,manager')) return;
    $('ci-emp').innerHTML = state.emps.map((e) => `<option value="${e.id}">${esc(e.employeeCode)} – ${esc(e.name)}</option>`).join('');
    $('ci-date').value = $('att-date').value || todayStr();
    $('ci-type').value = 'work';
    $('ci-note').value = '';
    fillCheckinShiftSelect();
    openModal('checkin-modal');
  }
  function toggleCheckinType() {
    const type = $('ci-type').value;
    $('ci-in').closest('.form-grid-2').style.display = type === 'work' ? '' : 'none';
    const shift = shiftById($('ci-shift').value);
    const ev = evaluate(shift, type, $('ci-in').value, $('ci-out').value);
    const st = ATT_STATUS[ev.status];
    $('ci-preview').innerHTML = `Kết quả dự kiến: <span class="badge ${st.cls}">${st.lbl}</span> · <strong>${esc(shift ? shift.name : 'Chưa phân ca')}</strong><br><span style="color:var(--text-muted)">${esc(ev.reason)}</span>`;
  }

  // Lưu: thử tạo mới; nếu đã có bản ghi cùng nhân viên + ca + ngày (409) thì cập nhật bản ghi đó
  async function saveCheckin() {
    if (!can('admin,hr,manager')) return;
    const employeeId = Number($('ci-emp').value);
    const date = $('ci-date').value;
    if (!employeeId || !date) { alert('Chọn nhân viên và ngày'); return; }
    const type = $('ci-type').value;
    const shiftId = Number($('ci-shift').value) || null;
    const payload = { employeeId, shiftId, date, type: 'NORMAL', note: $('ci-note').value.trim() || null };
    if (type === 'work') {
      payload.checkIn = $('ci-in').value;
      payload.checkOut = $('ci-out').value || null;
      if (!payload.checkIn) { alert('Vui lòng nhập giờ vào'); return; }
    } else {
      payload.status = type === 'leave' ? 'LEAVE' : 'ABSENT';
      payload.checkIn = null; payload.checkOut = null;
    }
    const ok = await run(async () => {
      try {
        await window.API.createAttendance(payload);
      } catch (err) {
        if (err.status !== 409) throw err;
        const existing = (await window.API.getAttendanceByDate(date)).find((r) => r.employeeId === employeeId && (r.shiftId || null) === shiftId);
        if (!existing) throw err;
        await window.API.updateAttendance(existing.id, payload);
      }
      return true;
    }, 'Không lưu được chấm công.');
    if (ok) { closeModal('checkin-modal'); $('att-date').value = date; renderAttendance(); }
  }

  /* ---------- Modal chi tiết ---------- */
  function openAttendanceDetail(id) {
    const r = rows.find((x) => x.id === Number(id));
    if (!r) return;
    const st = ATT_STATUS[r.status] || ATT_STATUS.ABSENT;
    const m = metaOf(r); const sh = m.shift;
    const emp = empById(r.employeeId) || r.employee;
    $('att-detail-body').innerHTML = `
      <div class="detail-hero">${empAvatar(r.employee)}
        <div><div class="emp-name">${esc(r.employee.name)}</div><div class="emp-sub">${esc(r.employee.employeeCode)} · ${esc((emp.department || {}).name || '')}</div></div>
        <span class="badge ${st.cls}" style="margin-left:auto">${st.lbl}</span></div>
      <div class="detail-grid">
        <div><span>Ngày</span><strong>${esc(r.date)}</strong></div>
        <div><span>Ca áp dụng</span><strong>${esc(sh ? sh.name : 'Chưa phân ca')}</strong></div>
        <div><span>Giờ ca</span><strong>${sh ? esc(sh.startTime + '–' + sh.endTime) : '—'}</strong></div>
        <div><span>Cho phép muộn</span><strong>${sh ? graceOf(sh) + ' phút' : '—'}</strong></div>
        <div><span>Giờ vào</span><strong>${esc(r.checkIn || '—')}</strong></div>
        <div><span>Giờ ra</span><strong>${esc(r.checkOut || '—')}</strong></div>
        <div><span>Đi muộn</span><strong>${m.late} phút</strong></div>
        <div><span>Về sớm</span><strong>${m.early} phút</strong></div>
        <div><span>Số giờ làm</span><strong>${r.workHours || 0} giờ</strong></div>
      </div>
      <div class="ci-preview"><strong>Kết luận:</strong> ${esc(m.reason)}${r.note ? `<br><strong>Ghi chú:</strong> ${esc(r.note)}` : ''}</div>`;
    openModal('att-detail-modal');
  }

  function exportAttendanceCSV() {
    const date = $('att-date').value || todayStr();
    const out = [['Ngày', 'Mã NV', 'Họ tên', 'Phòng ban', 'Ca làm', 'Giờ vào', 'Giờ ra', 'Giờ làm', 'Tình trạng', 'Chi tiết muộn/về sớm', 'Ghi chú']];
    rows.forEach((r) => {
      const m = metaOf(r);
      const dept = (empById(r.employeeId) || r.employee).department;
      out.push([date, r.employee.employeeCode, r.employee.name, dept ? dept.name : '', m.shift ? m.shift.name : '', r.checkIn || '', r.checkOut || '',
        r.workHours || 0, (ATT_STATUS[r.status] || ATT_STATUS.ABSENT).lbl, m.reason, r.note || '']);
    });
    downloadCSV('cham_cong_' + date + '.csv', out);
  }

  HR.pages.attendance = renderAttendance;
  Object.assign(window, { renderAttendance, fillCheckinShiftSelect, openCheckinModal, toggleCheckinType, saveCheckin, openAttendanceDetail, exportAttendanceCSV });
})();
