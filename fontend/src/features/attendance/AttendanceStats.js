export default function AttendanceStats({ counts }) {
  const items = [
    ['PRESENT', 'var(--success)', 'Bản ghi đúng giờ'],
    ['LATE', 'var(--warning)', 'Bản ghi muộn / về sớm'],
    ['ABSENT', 'var(--danger)', 'Vắng mặt'],
    ['LEAVE', 'var(--primary)', 'Nghỉ phép'],
  ];
  return (
    <div className="stats-grid">
      {items.map(([key, color, label]) => (
        <div className="stat-card" key={key}>
          <div className="stat-value" style={{ color }}>{counts[key]}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
