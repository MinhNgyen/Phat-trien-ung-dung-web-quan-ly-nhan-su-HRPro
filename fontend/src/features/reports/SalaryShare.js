export default function SalaryShare({ items }) {
  return items.map((s) => (
    <div className="kpi-bar-row" key={s.name}>
      <div className="kpi-bar-lbl">{s.name}</div>
      <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
      <div className="kpi-bar-val">{s.pct}%</div>
    </div>
  ));
}
