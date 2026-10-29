// Logic THUẦN của trang Cài đặt. key = tên field của backend (GET/PUT /settings/payroll)
export const PAYROLL_FIELDS = [
  { key: 'lunch', label: 'Phụ cấp ăn trưa (VNĐ)' },
  { key: 'fuel', label: 'Phụ cấp xăng xe (VNĐ)' },
  { key: 'phoneAllow', label: 'Phụ cấp điện thoại (VNĐ)' },
  { key: 'ot', label: 'Hệ số OT', step: '0.1' },
  { key: 'bhxh', label: 'BHXH NV (%)', step: '0.1' },
  { key: 'bhyt', label: 'BHYT NV (%)', step: '0.1' },
  { key: 'bhtn', label: 'BHTN NV (%)', step: '0.1' },
  { key: 'personalRelief', label: 'Giảm trừ bản thân (VNĐ)' },
  { key: 'standardDays', label: 'Số công chuẩn / tháng' },
  { key: 'latePenalty', label: 'Phạt đi muộn (VNĐ/lần)' },
];

export const emptySettingsForm = () => ({
  company: '', email: '', ...Object.fromEntries(PAYROLL_FIELDS.map((f) => [f.key, ''])),
});

export function formFromSettings(s) {
  const form = { company: s.company || '', email: s.email || '' };
  PAYROLL_FIELDS.forEach((f) => { form[f.key] = s[f.key] == null ? '' : String(s[f.key]); });
  return form;
}

// Trả về { payload } hoặc { error }
export function buildSettingsPayload(form) {
  const payload = { company: form.company.trim() || null, email: form.email.trim() };
  for (const f of PAYROLL_FIELDS) {
    const v = parseFloat(form[f.key]);
    if (Number.isNaN(v)) return { error: 'Vui lòng nhập đủ các giá trị số trong cấu hình lương' };
    payload[f.key] = v;
  }
  return { payload };
}
