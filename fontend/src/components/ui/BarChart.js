import { avColor } from '@/lib/format';

/**
 * Biểu đồ cột dùng chung. data = [{ label, value, color?, sub? }].
 * onBarClick(index): cột bấm được. activeLabel: làm mờ các cột khác (để nhấn mạnh 1 cột đang chọn).
 */
export default function BarChart({ data, height = 150, fmtValue, onBarClick, activeLabel }) {
  if (!data.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>Chưa có dữ liệu</div>;
  const maxVal = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const maxBarHeight = Math.max(50, height - 42);
  return (
    <div className="bar-chart-wrap" style={{ height }}>
      {data.map((d, i) => {
        const value = Number(d.value) || 0;
        const h = Math.max(8, Math.round((value / maxVal) * maxBarHeight));
        const shown = fmtValue ? fmtValue(value) : (d.sub || value);
        const dim = activeLabel && activeLabel !== d.label;
        return (
          <div className="bar-col" key={`${d.label}-${i}`} title={`${d.label}: ${shown}`}>
            <div className="bar-value" style={dim ? { opacity: 0.4 } : undefined}>{shown}</div>
            <div className="bar" style={{ height: h, background: d.color || avColor(i), cursor: onBarClick ? 'pointer' : undefined, opacity: dim ? 0.3 : undefined }}
              onClick={onBarClick ? () => onBarClick(i) : undefined} />
            <div className="bar-label" style={activeLabel === d.label ? { fontWeight: 700, color: 'var(--text)' } : undefined}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
