export default function KpiDeptBars({ items }) {
  if (!items.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có dữ liệu KPI kỳ này</div>;
  return items.map((d) => (
    <div className="kpi-bar-row" key={d.name}>
      <div className="kpi-bar-lbl">{d.name}</div>
      <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: `${d.avg}%`, background: d.color }} /></div>
      <div className="kpi-bar-val">{d.avg}</div>
    </div>
  ));
}
