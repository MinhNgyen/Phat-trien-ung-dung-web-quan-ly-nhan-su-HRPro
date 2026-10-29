// Logic THUẦN của trang Báo cáo
// groups = kết quả của groupByDept -> tỷ trọng quỹ lương (%) từng phòng ban
export function salaryShare(groups) {
  const total = groups.reduce((a, g) => a + g.salarySum, 0) || 1;
  return groups.map((g) => ({ name: g.name, color: g.color, pct: Math.round((g.salarySum / total) * 100) }));
}
