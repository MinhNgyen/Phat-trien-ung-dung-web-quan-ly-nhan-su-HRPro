// Gom nhân viên theo phòng ban (dùng cho Dashboard và Báo cáo)
// -> [{ name, count, salarySum, color }] theo thứ tự xuất hiện; nhân viên chưa có phòng ban vào nhóm "Chưa có"
export function groupByDept(emps, colorOf) {
  const map = new Map();
  emps.forEach((e) => {
    const name = e.department ? e.department.name : 'Chưa có';
    const g = map.get(name) || { name, count: 0, salarySum: 0, color: colorOf(e.department) };
    g.count += 1; g.salarySum += e.salary;
    map.set(name, g);
  });
  return [...map.values()];
}
