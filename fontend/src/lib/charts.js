// Tính hình học biểu đồ tròn (donut) — thuần, dễ test
export const DONUT_RADIUS = 50;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// data = [{ value, ... }] -> thêm len (độ dài cung), gap, offset cho stroke-dasharray / stroke-dashoffset
export function donutSegments(data) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let used = 0;
  return data.map((d) => {
    const len = (d.value / total) * DONUT_CIRCUMFERENCE;
    const seg = { ...d, len, gap: DONUT_CIRCUMFERENCE - len, offset: -used };
    used += len;
    return seg;
  });
}
