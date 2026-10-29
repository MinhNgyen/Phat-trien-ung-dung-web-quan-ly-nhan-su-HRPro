import { DONUT_RADIUS, donutSegments } from '@/lib/charts';
import { avColor } from '@/lib/format';

/**
 * Biểu đồ tròn + chú thích. data = [{ label, value, color? }]
 * onSelect(label): bấm cung tròn hoặc mục chú thích; activeLabel: cung đang chọn (các cung khác mờ đi).
 */
export default function DonutChart({ data, activeLabel, onSelect }) {
  const colored = data.map((d, i) => ({ ...d, color: d.color || avColor(i) }));
  const total = data.reduce((a, d) => a + d.value, 0);
  const active = colored.find((d) => d.label === activeLabel);
  const click = (label) => (onSelect ? () => onSelect(label) : undefined);
  return (
    <div className="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={DONUT_RADIUS} fill="none" stroke="#eef2f7" strokeWidth="16" />
        {donutSegments(colored).map((s) => (
          <circle key={s.label} cx="60" cy="60" r={DONUT_RADIUS} fill="none" stroke={s.color}
            strokeWidth={activeLabel === s.label ? 20 : 16} opacity={active && active.label !== s.label ? 0.3 : 1}
            strokeDasharray={`${s.len} ${s.gap}`} strokeDashoffset={s.offset} transform="rotate(-90 60 60)"
            style={{ cursor: onSelect ? 'pointer' : undefined, transition: 'opacity .2s, stroke-width .2s' }} onClick={click(s.label)}>
            <title>{`${s.label}: ${s.value}`}</title>
          </circle>
        ))}
        <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e293b">{active ? active.value : total}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#94a3b8">{active ? 'trong phòng' : 'nhân viên'}</text>
      </svg>
      <div className="donut-legend">
        {colored.map((d) => (
          <div className="legend-item" key={d.label} onClick={click(d.label)}
            style={{ cursor: onSelect ? 'pointer' : undefined, opacity: active && active.label !== d.label ? 0.45 : 1, fontWeight: active && active.label === d.label ? 700 : undefined }}>
            <span className="legend-dot" style={{ background: d.color }} />{d.label} <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
