/**
 * Seed dữ liệu mẫu cho HRPro
 * Chạy: npm run seed
 * Dùng upsert nên chạy nhiều lần không tạo dữ liệu trùng.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT = 10;

// ---------- Dữ liệu phòng ban ----------
const departments = [
  { code: 'KT', name: 'Kỹ thuật', description: 'Phòng phát triển phần mềm', head: 'Trần Quốc Bảo', color: '#2563eb' },
  { code: 'KD', name: 'Kinh doanh', description: 'Phòng kinh doanh và bán hàng', head: 'Nguyễn Thị Lan', color: '#16a34a' },
  { code: 'MKT', name: 'Marketing', description: 'Phòng tiếp thị và truyền thông', head: 'Lê Minh Quân', color: '#f59e0b' },
  { code: 'HC', name: 'Hành chính', description: 'Phòng hành chính nhân sự', head: 'Phạm Thu Hà', color: '#a855f7' },
  { code: 'KTO', name: 'Kế toán', description: 'Phòng kế toán tài chính', head: 'Đỗ Văn Nam', color: '#ef4444' },
];

// ---------- Dữ liệu ca làm ----------
const shifts = [
  { code: 'HC', name: 'Hành chính', startTime: '08:00', endTime: '17:00', description: 'Ca hành chính thứ 2 - thứ 6' },
  { code: 'S', name: 'Ca Sáng', startTime: '06:00', endTime: '14:00', description: 'Ca sáng' },
  { code: 'C', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', description: 'Ca chiều' },
  { code: 'D', name: 'Ca Đêm', startTime: '22:00', endTime: '06:00', description: 'Ca đêm, phụ cấp 30%' },
];

// ---------- 25 nhân viên mẫu ----------
const employees = [
  ['NV001', 'Nguyễn Văn An', 'an.nguyen@hrpro.vn', '0901000001', 'Trưởng phòng Kỹ thuật', 35000000, '2020-03-01', 'KT'],
  ['NV002', 'Trần Quốc Bảo', 'bao.tran@hrpro.vn', '0901000002', 'Senior Developer', 28000000, '2020-06-15', 'KT'],
  ['NV003', 'Lê Thị Cẩm', 'cam.le@hrpro.vn', '0901000003', 'Backend Developer', 22000000, '2021-01-10', 'KT'],
  ['NV004', 'Phạm Minh Dũng', 'dung.pham@hrpro.vn', '0901000004', 'Frontend Developer', 20000000, '2021-04-05', 'KT'],
  ['NV005', 'Hoàng Thị Én', 'en.hoang@hrpro.vn', '0901000005', 'Tester', 16000000, '2021-08-20', 'KT'],
  ['NV006', 'Vũ Đức Phong', 'phong.vu@hrpro.vn', '0901000006', 'DevOps Engineer', 26000000, '2022-02-01', 'KT'],
  ['NV007', 'Nguyễn Thị Lan', 'lan.nguyen@hrpro.vn', '0901000007', 'Trưởng phòng Kinh doanh', 32000000, '2019-11-01', 'KD'],
  ['NV008', 'Đặng Văn Hùng', 'hung.dang@hrpro.vn', '0901000008', 'Nhân viên kinh doanh', 15000000, '2022-03-15', 'KD'],
  ['NV009', 'Bùi Thị Hương', 'huong.bui@hrpro.vn', '0901000009', 'Nhân viên kinh doanh', 14500000, '2022-05-09', 'KD'],
  ['NV010', 'Ngô Thanh Tùng', 'tung.ngo@hrpro.vn', '0901000010', 'Chăm sóc khách hàng', 12000000, '2022-09-01', 'KD'],
  ['NV011', 'Lý Thị Mai', 'mai.ly@hrpro.vn', '0901000011', 'Chăm sóc khách hàng', 12000000, '2023-01-03', 'KD'],
  ['NV012', 'Lê Minh Quân', 'quan.le@hrpro.vn', '0901000012', 'Trưởng phòng Marketing', 30000000, '2020-08-17', 'MKT'],
  ['NV013', 'Trịnh Thu Trang', 'trang.trinh@hrpro.vn', '0901000013', 'Content Marketing', 14000000, '2022-06-20', 'MKT'],
  ['NV014', 'Đinh Văn Khoa', 'khoa.dinh@hrpro.vn', '0901000014', 'Digital Marketing', 16000000, '2022-10-10', 'MKT'],
  ['NV015', 'Nguyễn Hoài Nam', 'nam.nguyen@hrpro.vn', '0901000015', 'Designer', 15000000, '2023-02-13', 'MKT'],
  ['NV016', 'Phạm Thu Hà', 'ha.pham@hrpro.vn', '0901000016', 'Trưởng phòng Hành chính', 28000000, '2019-05-06', 'HC'],
  ['NV017', 'Võ Thị Kim', 'kim.vo@hrpro.vn', '0901000017', 'Chuyên viên nhân sự', 15000000, '2021-07-01', 'HC'],
  ['NV018', 'Hà Văn Long', 'long.ha@hrpro.vn', '0901000018', 'Nhân viên hành chính', 11000000, '2022-11-14', 'HC'],
  ['NV019', 'Cao Thị Ngọc', 'ngoc.cao@hrpro.vn', '0901000019', 'Lễ tân', 9500000, '2023-03-06', 'HC'],
  ['NV020', 'Đỗ Văn Nam', 'nam.do@hrpro.vn', '0901000020', 'Kế toán trưởng', 30000000, '2019-09-02', 'KTO'],
  ['NV021', 'Trần Thị Oanh', 'oanh.tran@hrpro.vn', '0901000021', 'Kế toán tổng hợp', 18000000, '2021-03-22', 'KTO'],
  ['NV022', 'Nguyễn Văn Phúc', 'phuc.nguyen@hrpro.vn', '0901000022', 'Kế toán công nợ', 15000000, '2022-01-17', 'KTO'],
  ['NV023', 'Lương Thị Quỳnh', 'quynh.luong@hrpro.vn', '0901000023', 'Kế toán kho', 13000000, '2023-05-08', 'KTO'],
  ['NV024', 'Mai Văn Sơn', 'son.mai@hrpro.vn', '0901000024', 'Mobile Developer', 21000000, '2023-06-12', 'KT'],
  ['NV025', 'Phan Thị Thảo', 'thao.phan@hrpro.vn', '0901000025', 'Business Analyst', 19000000, '2023-08-01', 'KT'],
];

// Tài khoản mẫu cho từng vai trò
const accounts = [
  { username: 'admin', password: 'admin123', fullName: 'Quản trị hệ thống', role: 'ADMIN', employeeCode: null },
  { username: 'hr', password: 'hr123456', fullName: 'Phạm Thu Hà', role: 'HR', employeeCode: 'NV016' },
  { username: 'ketoan', password: 'ketoan123', fullName: 'Đỗ Văn Nam', role: 'ACCOUNTANT', employeeCode: 'NV020' },
  { username: 'nhanvien', password: 'nhanvien123', fullName: 'Trần Quốc Bảo', role: 'EMPLOYEE', employeeCode: 'NV002' },
];

function pad(n) { return String(n).padStart(2, '0'); }

async function main() {
  console.log('--- Bắt đầu seed dữ liệu HRPro ---');

  // 1. Phòng ban
  const deptMap = {};
  for (const d of departments) {
    const row = await prisma.department.upsert({ where: { code: d.code }, update: d, create: d });
    deptMap[d.code] = row.id;
  }
  console.log(`✔ Đã tạo ${departments.length} phòng ban`);

  // 2. Ca làm
  const shiftMap = {};
  for (const s of shifts) {
    const row = await prisma.shift.upsert({ where: { code: s.code }, update: s, create: s });
    shiftMap[s.code] = row.id;
  }
  console.log(`✔ Đã tạo ${shifts.length} ca làm việc`);

  // 3. Nhân viên
  const empMap = {};
  for (const [employeeCode, name, email, phone, position, salary, joinedAt, deptCode] of employees) {
    const data = {
      employeeCode, name, email, phone, position,
      salary, joinedAt: new Date(joinedAt),
      status: 'ACTIVE', departmentId: deptMap[deptCode],
    };
    const row = await prisma.employee.upsert({ where: { employeeCode }, update: data, create: data });
    empMap[employeeCode] = row.id;
  }
  console.log(`✔ Đã tạo ${employees.length} nhân viên`);

  // 4. Tài khoản đăng nhập (mật khẩu hash bằng bcrypt)
  for (const a of accounts) {
    const hashed = await bcrypt.hash(a.password, SALT);
    const user = await prisma.user.upsert({
      where: { username: a.username },
      update: { fullName: a.fullName, role: a.role },
      create: { username: a.username, password: hashed, fullName: a.fullName, role: a.role },
    });
    if (a.employeeCode && empMap[a.employeeCode]) {
      await prisma.employee.update({ where: { id: empMap[a.employeeCode] }, data: { userId: user.id } });
    }
  }
  console.log(`✔ Đã tạo ${accounts.length} tài khoản (admin/admin123)`);

  // 5. Phân ca: đa số hành chính, một số làm ca sáng/chiều
  const codes = Object.keys(empMap);
  for (let i = 0; i < codes.length; i++) {
    const employeeId = empMap[codes[i]];
    const shiftId = i % 5 === 0 ? shiftMap.S : i % 7 === 0 ? shiftMap.C : shiftMap.HC;
    await prisma.employeeShift.upsert({
      where: { employeeId_shiftId: { employeeId, shiftId } },
      update: { isPrimary: true },
      create: { employeeId, shiftId, isPrimary: true },
    });
  }
  console.log('✔ Đã phân ca cho toàn bộ nhân viên');

  // 6. Chấm công 30 ngày gần nhất (bỏ qua thứ 7, chủ nhật)
  const today = new Date();
  let attCount = 0;
  for (const code of codes) {
    const employeeId = empMap[code];
    const assign = await prisma.employeeShift.findFirst({ where: { employeeId }, include: { shift: true } });
    if (!assign) continue;

    for (let back = 30; back >= 0; back--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - back));
      const dow = d.getUTCDay();
      if (dow === 0 || dow === 6) continue; // cuối tuần

      const rand = Math.random();
      let status = 'PRESENT';
      let checkIn = assign.shift.startTime;
      let checkOut = assign.shift.endTime;
      let lateMinutes = 0;

      if (rand < 0.05) { status = 'ABSENT'; checkIn = null; checkOut = null; }
      else if (rand < 0.1) { status = 'LEAVE'; checkIn = null; checkOut = null; }
      else if (rand < 0.25) {
        status = 'LATE';
        lateMinutes = 5 + Math.floor(Math.random() * 25);
        const [h, m] = assign.shift.startTime.split(':').map(Number);
        const total = h * 60 + m + lateMinutes;
        checkIn = `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
      }

      let workHours = 0;
      if (checkIn && checkOut) {
        const [h1, m1] = checkIn.split(':').map(Number);
        const [h2, m2] = checkOut.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        workHours = Math.round((diff / 60) * 100) / 100;
      }

      await prisma.attendance.upsert({
        where: { employee_shift_date: { employeeId, shiftId: assign.shiftId, date: d } },
        update: {},
        create: {
          employeeId, shiftId: assign.shiftId, date: d,
          checkIn, checkOut, workHours, lateMinutes,
          status, type: 'NORMAL',
        },
      });
      attCount++;
    }
  }
  console.log(`✔ Đã tạo ${attCount} bản ghi chấm công`);

  // 7. KPI tháng hiện tại
  const period = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  for (const code of codes) {
    const employeeId = empMap[code];
    const r = () => 60 + Math.floor(Math.random() * 40);
    const k = { sales: r(), attendance: r(), task: r(), deadline: r(), quality: r() };
    const total = Math.round((k.sales * 0.25 + k.attendance * 0.2 + k.task * 0.25 + k.deadline * 0.15 + k.quality * 0.15) * 100) / 100;
    await prisma.kpi.upsert({
      where: { employeeId_period: { employeeId, period } },
      update: { ...k, total },
      create: { employeeId, period, ...k, total, note: 'Dữ liệu mẫu' },
    });
  }
  console.log(`✔ Đã tạo KPI kỳ ${period}`);

  // 8. Cấu hình lương công ty (singleton id=1) — khớp SEED_SETTINGS cũ của frontend
  await prisma.payrollSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      company: 'Công ty TNHH HRPro Demo',
      email: 'hr@hrpro.vn',
      lunch: 730000,
      fuel: 500000,
      phoneAllow: 300000,
      ot: 1.5,
      bhxh: 8,
      bhyt: 1.5,
      bhtn: 1,
      personalRelief: 11000000,
      standardDays: 22,
      latePenalty: 50000,
    },
  });
  console.log('✔ Đã tạo cấu hình lương mặc định');

  console.log('--- Seed hoàn tất ---');
  console.log('Đăng nhập: admin / admin123');
}

main()
  .catch((e) => { console.error('Seed lỗi:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
