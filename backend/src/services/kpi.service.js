/**
 * kpi.service.js — Tính KPI từ đầu việc (tasks).
 *
 * Việc thuộc kỳ (YYYY-MM) theo THÁNG CỦA dueDate. Việc đã hủy (CANCELLED) không được tính.
 * Mọi tỉ lệ đều theo TRỌNG SỐ của việc (weight 1-5):
 *   completionRate = Σ weight(việc DONE)                / Σ weight(mọi việc)            × 100
 *   onTimeRate     = Σ weight(DONE và completedAt ≤ dueDate) / Σ weight(việc DONE)         × 100
 *   qualityScore   = Σ weight × quality (việc DONE)    / Σ weight(việc DONE)
 *   total          = 40% completionRate + 30% onTimeRate + 30% qualityScore
 * Việc chưa xong tính vào mẫu số của completionRate, nên KPI của tháng đang chạy là KPI "tạm tính".
 */
const prisma = require('../config/database');
const { monthRange, toNumber } = require('../utils/helpers');

const WEIGHTS = { completion: 0.4, onTime: 0.3, quality: 0.3 };
const round2 = (n) => Math.round(n * 100) / 100;
const periodOf = (date) => new Date(date).toISOString().slice(0, 7);
const dayOf = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Hàm thuần (không đụng DB): nhận danh sách việc của 1 nhân viên trong 1 kỳ, trả về chỉ số KPI.
 * Trả về null nếu không có việc nào (không tính việc đã hủy).
 */
function computeFromTasks(tasks) {
  const active = tasks.filter((t) => t.status !== 'CANCELLED');
  if (!active.length) return null;

  const done = active.filter((t) => t.status === 'DONE');
  const onTime = done.filter((t) => t.completedAt && dayOf(t.completedAt) <= dayOf(t.dueDate));
  const sum = (list) => list.reduce((s, t) => s + (t.weight || 1), 0);
  const W = sum(active);
  const Wd = sum(done);
  const Wo = sum(onTime);

  const completionRate = W ? (Wd / W) * 100 : 0;
  const onTimeRate = Wd ? (Wo / Wd) * 100 : 0;
  const qualityScore = Wd ? done.reduce((s, t) => s + (t.weight || 1) * (t.quality || 0), 0) / Wd : 0;
  const total = completionRate * WEIGHTS.completion + onTimeRate * WEIGHTS.onTime + qualityScore * WEIGHTS.quality;

  return {
    totalTasks: active.length,
    doneTasks: done.length,
    onTimeTasks: onTime.length,
    completionRate: round2(completionRate),
    onTimeRate: round2(onTimeRate),
    qualityScore: round2(qualityScore),
    total: round2(total),
  };
}

// Tính lại KPI của 1 nhân viên trong 1 kỳ và ghi vào bảng kpis (không còn việc nào -> xóa dòng KPI)
async function recalcEmployeePeriod(employeeId, period) {
  const { start, end } = monthRange(period);
  const tasks = await prisma.task.findMany({ where: { employeeId, dueDate: { gte: start, lt: end } } });
  const stats = computeFromTasks(tasks);
  if (!stats) {
    await prisma.kpi.deleteMany({ where: { employeeId, period } });
    return null;
  }
  return prisma.kpi.upsert({
    where: { employeeId_period: { employeeId, period } },
    update: stats,
    create: { employeeId, period, ...stats },
  });
}

// Tính lại KPI cả kỳ (mọi nhân viên có việc trong kỳ, hoặc chỉ 1 nhân viên nếu truyền employeeId)
async function recalcPeriod(period, employeeId) {
  const { start, end } = monthRange(period);
  const where = { dueDate: { gte: start, lt: end }, ...(employeeId ? { employeeId } : {}) };
  const ids = (await prisma.task.findMany({ where, select: { employeeId: true }, distinct: ['employeeId'] })).map((r) => r.employeeId);
  // thêm cả những nhân viên đang có dòng KPI cũ nhưng không còn việc nào -> recalc sẽ xóa dòng đó
  const old = await prisma.kpi.findMany({ where: { period, ...(employeeId ? { employeeId } : {}) }, select: { employeeId: true } });
  for (const k of old) if (!ids.includes(k.employeeId)) ids.push(k.employeeId);
  const out = [];
  for (const id of ids) out.push(await recalcEmployeePeriod(id, period));
  return out.filter(Boolean);
}

// Sau khi 1 việc thay đổi: tính lại các (nhân viên, kỳ) bị ảnh hưởng (kỳ cũ + kỳ mới nếu đổi hạn/người nhận)
async function recalcAffected(pairs) {
  const seen = new Set();
  for (const { employeeId, dueDate } of pairs) {
    if (!employeeId || !dueDate) continue;
    const key = `${employeeId}|${periodOf(dueDate)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await recalcEmployeePeriod(employeeId, periodOf(dueDate));
  }
}

module.exports = { WEIGHTS, computeFromTasks, recalcEmployeePeriod, recalcPeriod, recalcAffected, periodOf, toNumber };
