/**
 * Chỉ upsert tài khoản mẫu (không đụng chấm công / đầu việc / KPI).
 * Chạy: node prisma/upsert-accounts.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SALT = 10;

const accounts = [
  {
    username: "quanlykd",
    password: "quanly123",
    fullName: "Nguyễn Thị Lan",
    role: "MANAGER",
    employeeCode: "NV007",
  },
  {
    username: "quanlymkt",
    password: "quanly123",
    fullName: "Lê Minh Quân",
    role: "MANAGER",
    employeeCode: "NV012",
  },
  {
    username: "hr2",
    password: "hr123456",
    fullName: "Võ Thị Kim",
    role: "HR",
    employeeCode: "NV017",
  },
  {
    username: "ketoan2",
    password: "ketoan123",
    fullName: "Trần Thị Oanh",
    role: "ACCOUNTANT",
    employeeCode: "NV021",
  },
  {
    username: "nhanvienkd",
    password: "nhanvien123",
    fullName: "Đặng Văn Hùng",
    role: "EMPLOYEE",
    employeeCode: "NV008",
  },
  {
    username: "nhanvienmkt",
    password: "nhanvien123",
    fullName: "Trịnh Thu Trang",
    role: "EMPLOYEE",
    employeeCode: "NV013",
  },
];

async function main() {
  for (const a of accounts) {
    const hashed = await bcrypt.hash(a.password, SALT);
    const user = await prisma.user.upsert({
      where: { username: a.username },
      update: { fullName: a.fullName, role: a.role, password: hashed },
      create: {
        username: a.username,
        password: hashed,
        fullName: a.fullName,
        role: a.role,
      },
    });
    const emp = await prisma.employee.findUnique({
      where: { employeeCode: a.employeeCode },
    });
    if (!emp) {
      console.log(`SKIP ${a.username} — chưa có ${a.employeeCode}`);
      continue;
    }
    await prisma.employee.update({
      where: { id: emp.id },
      data: { userId: user.id },
    });
    console.log(`OK ${a.username}  ${a.role}  ${a.employeeCode} ${emp.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
