export default function ShiftChips({ employee }) {
  const list = (employee && employee.shifts) || [];
  if (!list.length) return <span className="badge badge-gray">Chưa phân ca</span>;
  return list.map((s) => <span key={s.id} className="shift-chip">{s.name}</span>);
}
