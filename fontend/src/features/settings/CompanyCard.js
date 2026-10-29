export default function CompanyCard({ form, onChange, employeeCount, onSave, busy }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Thông tin công ty</div></div>
      <div className="card-body">
        <div className="form-group"><label className="form-label">Tên công ty</label>
          <input className="form-control" value={form.company} onChange={onChange('company')} /></div>
        <div className="form-group"><label className="form-label">Quy mô nhân sự</label>
          <input className="form-control" value={`${employeeCount} nhân viên`} readOnly /></div>
        <div className="form-group"><label className="form-label">Email</label>
          <input className="form-control" value={form.email} onChange={onChange('email')} /></div>
        <div className="form-actions"><button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>💾 Lưu</button></div>
      </div>
    </div>
  );
}
