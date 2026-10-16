// Cac ham tien ich dung chung

// "08:30" -> 510 (so phut tu 00:00)
function timeToMinutes(time) {
  if (!time || typeof time !== 'string') return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// Tinh so gio lam viec giua check-in va check-out (ho tro ca dem qua ngay)
function calcWorkHours(checkIn, checkOut) {
  const start = timeToMinutes(checkIn);
  let end = timeToMinutes(checkOut);
  if (start === null || end === null) return 0;
  if (end < start) end += 24 * 60; // ca dem: 22:00 -> 06:00
  return Math.round(((end - start) / 60) * 100) / 100;
}

// So phut di muon so voi gio bat dau ca, da tru so phut cho phep muon (grace)
function calcLateMinutes(checkIn, shiftStart, grace = 0) {
  const c = timeToMinutes(checkIn);
  const s = timeToMinutes(shiftStart);
  if (c === null || s === null) return 0;
  return Math.max(0, c - (s + (Number(grace) || 0)));
}

// So phut ve som so voi gio ket thuc ca (ho tro ca dem qua ngay)
function calcEarlyMinutes(checkOut, shiftStart, shiftEnd) {
  const o = timeToMinutes(checkOut);
  const s = timeToMinutes(shiftStart);
  const e = timeToMinutes(shiftEnd);
  if (o === null || s === null || e === null) return 0;
  let outAdj = o;
  let endAdj = e;
  if (e <= s) {            // ca dem: 22:00 -> 06:00
    endAdj = e + 1440;
    if (o < s) outAdj = o + 1440;
  }
  return Math.max(0, endAdj - outAdj);
}

// Chuan hoa ngay -> Date luc 00:00:00 UTC (khop kieu @db.Date)
function toDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// "2026-09" -> { start: 2026-09-01, end: 2026-10-01 }
function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

// Chuyen Decimal cua Prisma sang Number de tra ve JSON dep
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  timeToMinutes, calcWorkHours, calcLateMinutes, calcEarlyMinutes,
  toDateOnly, monthRange, toNumber, currentMonth,
};
