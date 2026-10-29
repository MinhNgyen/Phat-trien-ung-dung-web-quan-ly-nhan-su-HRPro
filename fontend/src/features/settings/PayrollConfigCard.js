import Can from '@/components/Can';
import { PAYROLL_FIELDS } from './settingsUtils';

export default function PayrollConfigCard({ form, onChange, onSave, busy }) {
  // 2 ô một hàng, đúng bố cục cũ
  const rows = [];
  for (let i = 0; i < PAYROLL_FIELDS.length; i += 2) rows.push(PAYROLL_FIELDS.slice(i, i + 2));
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Cấu hình lương & bảo hiểm</div></div>
      <div className="card-body">
        {rows.map((row) => (
          <div className="form-grid-2" key={row[0].key}>
            {row.map((f) => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input className="form-control" type="number" step={f.step} value={form[f.key]} onChange={onChange(f.key)} />
              </div>
            ))}
          </div>
        ))}
        <div className="form-actions">
          <Can roles="admin,accountant"><button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>💾 Lưu cấu hình</button></Can>
        </div>
      </div>
    </div>
  );
}
