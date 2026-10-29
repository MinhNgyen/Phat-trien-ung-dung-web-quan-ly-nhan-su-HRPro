# HRPro Backend — REST API

Backend cho hệ thống quản lý nhân sự HRPro.

**Kiến trúc:** Frontend (HTML/CSS/JS) → REST API → Node.js + Express → Prisma ORM → MySQL

---

## 1. Yêu cầu

- Node.js >= 18
- MySQL >= 8.0
- npm

## 2. Cài đặt nhanh

```bash
# 1. Vào thư mục backend
cd backend

# 2. Cài package
npm install

# 3. Tạo file .env từ mẫu rồi sửa DATABASE_URL + JWT_SECRET
cp .env.example .env

# 4. Tạo database trong MySQL
#    CREATE DATABASE hrpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 5. Tạo bảng
npx prisma migrate dev --name init

# 6. Nạp dữ liệu mẫu
npm run seed

# 7. Chạy server
npm run dev
```

Kiểm tra: `GET http://localhost:5000/api/health`

```json
{ "success": true, "message": "HRPro Backend is running" }
```

## 3. Tài khoản mẫu

| Username | Password | Role | Nhân viên gắn với TK |
|---|---|---|---|
| admin | admin123 | ADMIN | — |
| hr123 | hr123456 | HR | NV016 Phạm Thu Hà |
| hr2 | hr123456 | HR | NV017 Võ Thị Kim |
| ketoan | ketoan123 | ACCOUNTANT | NV020 Đỗ Văn Nam |
| ketoan2 | ketoan123 | ACCOUNTANT | NV021 Trần Thị Oanh |
| quanly | quanly123 | MANAGER | NV001 Nguyễn Văn An (Kỹ thuật) |
| quanlykd | quanly123 | MANAGER | NV007 Nguyễn Thị Lan (Kinh doanh) |
| quanlymkt | quanly123 | MANAGER | NV012 Lê Minh Quân (Marketing) |
| nhanvien | nhanvien123 | EMPLOYEE | NV002 Trần Quốc Bảo (Kỹ thuật) |
| nhanvienkd | nhanvien123 | EMPLOYEE | NV008 Đặng Văn Hùng (Kinh doanh) |
| nhanvienmkt | nhanvien123 | EMPLOYEE | NV013 Trịnh Thu Trang (Marketing) |

## 4. NPM scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy dev với nodemon |
| `npm start` | Chạy production |
| `npm run seed` | Nạp dữ liệu mẫu |
| `npm run prisma:generate` | Sinh Prisma Client |
| `npm run prisma:migrate` | Tạo/chạy migration |
| `npm run prisma:studio` | Mở giao diện xem DB |

---

## 5. Định dạng response

**Thành công**
```json
{ "success": true, "message": "Thành công", "data": {} }
```

**Lỗi**
```json
{ "success": false, "message": "Có lỗi xảy ra", "errors": [] }
```

**HTTP status:** 200, 201, 400, 401, 403, 404, 409, 500.

**Xác thực:** gửi header `Authorization: Bearer <token>` cho mọi API trừ `/api/auth/login` và `/api/health`.

---

## 6. Danh sách API

### 6.1 Auth

| Method | URL | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/login` | Không | — |
| GET | `/api/auth/me` | Có | Mọi role |
| PUT | `/api/auth/change-password` | Có | Mọi role |
| POST | `/api/auth/register` | Có | ADMIN |
| GET | `/api/auth/users` | Có | ADMIN |

**POST /api/auth/login**

Request:
```json
{ "username": "admin", "password": "admin123" }
```
Response 200:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "username": "admin", "role": "ADMIN", "employee": null }
  }
}
```
Lỗi 401: `{ "success": false, "message": "Tên đăng nhập hoặc mật khẩu không đúng", "errors": [] }`

### 6.2 Employees

| Method | URL | Role |
|---|---|---|
| GET | `/api/employees?search=&departmentId=&status=&page=&limit=` | ADMIN, HR, ACCOUNTANT |
| GET | `/api/employees/:id` | ADMIN, HR, ACCOUNTANT, hoặc chính mình |
| POST | `/api/employees` | ADMIN, HR |
| PUT | `/api/employees/:id` | ADMIN, HR |
| DELETE | `/api/employees/:id` | ADMIN |
| GET | `/api/employees/:id/shifts` | ADMIN, HR, ACCOUNTANT, hoặc chính mình |
| POST | `/api/employees/:id/shifts` | ADMIN, HR |
| DELETE | `/api/employees/:id/shifts/:shiftId` | ADMIN, HR |

**POST /api/employees** — body:
```json
{
  "employeeCode": "NV100",
  "name": "Nguyễn Văn A",
  "email": "a@example.com",
  "phone": "0900000000",
  "position": "Developer",
  "salary": 15000000,
  "joinedAt": "2026-01-15",
  "status": "ACTIVE",
  "departmentId": 1
}
```
Lỗi 409 nếu trùng `employeeCode` hoặc `email`.

GET trả về kèm `department` và `shifts`.

**POST /api/employees/:id/shifts** — body `{ "shiftId": 1, "isPrimary": true }`. Trùng employee + shift → 409.

### 6.3 Departments

| Method | URL | Role |
|---|---|---|
| GET | `/api/departments` | Mọi role |
| GET | `/api/departments/:id` | Mọi role |
| GET | `/api/departments/:id/employees` | ADMIN, HR, ACCOUNTANT |
| POST | `/api/departments` | ADMIN, HR |
| PUT | `/api/departments/:id` | ADMIN, HR |
| DELETE | `/api/departments/:id` | ADMIN |

Body: `{ "code": "KT", "name": "Kỹ thuật", "description": "...", "head": "...", "color": "#2563eb" }`.
Xoá phòng ban còn nhân viên → 409.

### 6.4 Shifts

| Method | URL | Role |
|---|---|---|
| GET | `/api/shifts` | Mọi role |
| GET | `/api/shifts/:id` | Mọi role |
| POST | `/api/shifts` | ADMIN, HR |
| PUT | `/api/shifts/:id` | ADMIN, HR |
| DELETE | `/api/shifts/:id` | ADMIN |

Body: `{ "code": "HC", "name": "Hành chính", "startTime": "08:00", "endTime": "17:00" }` (giờ dạng `HH:mm`).

### 6.5 Attendance

| Method | URL | Role |
|---|---|---|
| GET | `/api/attendance?employeeId=&date=&month=&status=&from=&to=` | ADMIN, HR, ACCOUNTANT |
| GET | `/api/attendance/:id` | ADMIN, HR, ACCOUNTANT |
| GET | `/api/attendance/employee/:employeeId?month=YYYY-MM` | ADMIN, HR, ACCOUNTANT, chính mình |
| GET | `/api/attendance/date/:date` | ADMIN, HR |
| POST | `/api/attendance` | ADMIN, HR |
| POST | `/api/attendance/check-in` | ADMIN, HR, EMPLOYEE |
| POST | `/api/attendance/check-out` | ADMIN, HR, EMPLOYEE |
| PUT | `/api/attendance/:id` | ADMIN, HR |
| DELETE | `/api/attendance/:id` | ADMIN, HR |

Body POST:
```json
{
  "employeeId": 1, "shiftId": 1, "date": "2026-09-21",
  "checkIn": "08:05", "checkOut": "17:00", "type": "NORMAL", "note": ""
}
```
Backend tự tính `workHours`, `lateMinutes`, và `status` (PRESENT / LATE / ABSENT) nếu client không gửi `status`.
Trùng `employee + shift + date` → 409.

### 6.6 Payroll

| Method | URL | Role |
|---|---|---|
| GET | `/api/payroll?month=&employeeId=` | ADMIN, ACCOUNTANT, HR |
| GET | `/api/payroll/:month` (vd `/api/payroll/2026-09`) | ADMIN, ACCOUNTANT, HR |
| GET | `/api/payroll/employee/:employeeId` | ADMIN, ACCOUNTANT, HR, chính mình |
| GET | `/api/payroll/locks` | ADMIN, ACCOUNTANT |
| POST | `/api/payroll/calculate` | ADMIN, ACCOUNTANT |
| PUT | `/api/payroll/:id` | ADMIN, ACCOUNTANT |
| DELETE | `/api/payroll/:id` | ADMIN |
| POST | `/api/payroll/lock` | ADMIN, ACCOUNTANT |
| POST | `/api/payroll/unlock` | **Chỉ ADMIN** |

**Công thức** (`src/services/payroll.service.js`):
```
baseSalary  = salary / 26 * workDays
overtime    = giờ OT * (salary / 26 / 8) * 1.5
deduction   = khấu trừ nhập tay + phạt đi muộn (20.000đ / 30 phút)
grossSalary = baseSalary + overtime + allowance - deduction
tax         = max(0, grossSalary - 11.000.000) * 10%
netSalary   = grossSalary - tax
```

**POST /api/payroll/calculate** — body `{ "month": "2026-09", "employeeId": 1, "allowance": 500000 }`.
Không truyền `employeeId` → tính cho toàn bộ nhân viên đang làm việc. Dùng `upsert` nên chạy lại không sinh bản ghi trùng.

**Khoá lương:** sau khi `POST /api/payroll/lock { "month": "2026-09" }`, mọi thao tác sửa/xoá/tính lại tháng đó trả 403.

### 6.7 Tasks (đầu việc) và KPI

**KPI không nhập tay** — được tính tự động từ đầu việc giao cho nhân viên.

| Method | URL | Role |
|---|---|---|
| GET | `/api/tasks?employeeId=&period=&status=` | ADMIN, HR, ACCOUNTANT, MANAGER |
| GET | `/api/tasks/employee/:employeeId?period=` | như trên, hoặc chính nhân viên đó |
| GET | `/api/tasks/:id` | mọi role (nhân viên chỉ xem việc của mình) |
| POST | `/api/tasks` | ADMIN, HR, MANAGER — giao việc |
| PUT | `/api/tasks/:id` | ADMIN, HR, MANAGER — sửa / duyệt hoàn thành |
| PATCH | `/api/tasks/:id/status` | nhân viên tự báo `TODO`/`IN_PROGRESS`/`REVIEW` việc của mình |
| DELETE | `/api/tasks/:id` | ADMIN, HR, MANAGER |
| GET | `/api/kpi?period=&employeeId=` | ADMIN, HR, ACCOUNTANT, MANAGER |
| GET | `/api/kpi/employee/:employeeId` | như trên, hoặc chính nhân viên đó |
| GET | `/api/kpi/:id` | ADMIN, HR, ACCOUNTANT, MANAGER |
| POST | `/api/kpi/recalculate` | ADMIN, HR, MANAGER — dựng lại KPI cả kỳ từ đầu việc |

**Quy trình việc:** `TODO` → `IN_PROGRESS` → `REVIEW` (nhân viên báo xong) → `DONE` (quản lý duyệt, **bắt buộc chấm `quality` 0-100**). `CANCELLED` không tính vào KPI.

**Giao việc:** `POST /api/tasks` body `{ "employeeId": 1, "title": "Báo cáo quý", "dueDate": "2026-10-25", "weight": 3 }` (`weight` 1-5, mặc định 1).

**Cách tính KPI** (`src/services/kpi.service.js`) — việc thuộc kỳ theo **tháng của `dueDate`**, mọi tỉ lệ theo trọng số việc:
```
completionRate = Σ weight(việc DONE)                      / Σ weight(mọi việc, trừ đã hủy) × 100
onTimeRate     = Σ weight(DONE và completedAt ≤ dueDate) / Σ weight(việc DONE)            × 100
qualityScore   = Σ weight × quality (việc DONE)           / Σ weight(việc DONE)
total          = 40% completionRate + 30% onTimeRate + 30% qualityScore
```
Việc chưa xong nằm trong mẫu số của `completionRate`, nên KPI tháng đang chạy là KPI "tạm tính". Mỗi lần thêm/sửa/xóa việc, KPI của (nhân viên, kỳ) bị ảnh hưởng được **tự tính lại** (cả kỳ cũ lẫn kỳ mới nếu đổi hạn hoặc người nhận). Nhân viên không còn việc nào trong kỳ thì không có dòng KPI.

### 6.8 Settings (cấu hình lương)

| Method | URL | Role |
|---|---|---|
| GET | `/api/settings/payroll` | ADMIN, HR, ACCOUNTANT |
| PUT | `/api/settings/payroll` | ADMIN, ACCOUNTANT |

Bản ghi duy nhất (singleton `id=1`), tự tạo với giá trị mặc định nếu chưa seed. Body PUT (mọi field optional, chỉ gửi field muốn sửa):
```json
{
  "lunch": 730000, "fuel": 500000, "phoneAllow": 300000,
  "ot": 1.5, "bhxh": 8, "bhyt": 1.5, "bhtn": 1,
  "personalRelief": 11000000, "standardDays": 22, "latePenalty": 50000
}
```
`payroll.service.js` đọc trực tiếp bảng này khi tính lương — sửa cấu hình ở đây sẽ ảnh hưởng ngay lần `POST /api/payroll/calculate` tiếp theo (không ảnh hưởng ngược các bảng lương đã tính trước đó).

### 6.9 Reports

| Method | URL | Role |
|---|---|---|
| GET | `/api/reports/dashboard` | Mọi role |
| GET | `/api/reports/employees` | ADMIN, HR, ACCOUNTANT |
| GET | `/api/reports/attendance?month=YYYY-MM` | ADMIN, HR |
| GET | `/api/reports/payroll?month=YYYY-MM` | ADMIN, ACCOUNTANT |
| GET | `/api/reports/kpi?period=YYYY-MM` | ADMIN, HR |

Dashboard trả về:
```json
{
  "totalEmployees": 25, "activeEmployees": 23, "departments": 5,
  "presentToday": 20, "lateToday": 2, "absentToday": 1,
  "onLeaveToday": 2, "monthlyPayroll": 350000000
}
```

---

## 6b. Tài liệu API (Swagger)

Chạy server rồi mở **http://localhost:5000/api-docs** (JSON thô: `/api-docs.json`).
Gọi `POST /auth/login` để lấy token, bấm **Authorize** ở góc trên bên phải và dán token (không cần chữ "Bearer") là thử được mọi endpoint.
Mô tả từng endpoint nằm ngay trên dòng `router.xxx(...)` trong `src/routes/*.js` (khối `@openapi`); schema dùng chung ở `src/config/swagger.js`.

---

## 7. Docker

Từ thư mục gốc `HRPro/`:

```bash
docker compose up -d --build
docker compose exec hrpro-backend npm run seed
```

Backend: http://localhost:5000 — MySQL map ra cổng **3307** để không đụng MySQL cài sẵn trên máy.
Trong container, `DATABASE_URL` dùng service name `hrpro-mysql`, không dùng `localhost`.

---

## 8. Lỗi thường gặp

| Lỗi | Nguyên nhân / cách sửa |
|---|---|
| `Can't reach database server at localhost:3306` | MySQL chưa chạy, hoặc sai `DATABASE_URL` trong `.env` |
| `P1003: Database hrpro does not exist` | Tạo DB: `CREATE DATABASE hrpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` |
| `Error: Cannot find module '@prisma/client'` | Chạy `npx prisma generate` |
| `Access denied for user 'root'` | Sai mật khẩu MySQL; nếu mật khẩu có ký tự đặc biệt phải URL-encode (`@` → `%40`) |
| `[FATAL] Thiếu JWT_SECRET` | Chưa tạo `.env` từ `.env.example` |
| Frontend bị chặn CORS | Đặt `CORS_ORIGIN` trong `.env`, hoặc để `*` khi dev |
| Chữ tiếng Việt thành `?????` | DB không phải utf8mb4 — tạo lại DB với `CHARACTER SET utf8mb4` |
| Token hết hạn → 401 | Đăng nhập lại; đổi `JWT_EXPIRES_IN` nếu cần |

---

## 9. Cấu trúc thư mục

```
backend/
├── prisma/           schema.prisma, seed.js
└── src/
    ├── config/       kết nối Prisma
    ├── controllers/  xử lý HTTP request/response
    ├── services/     business logic (auth, payroll, report)
    ├── routes/       định nghĩa endpoint
    ├── middlewares/   auth, role, validate, error
    ├── validators/   schema Zod
    ├── utils/        jwt, response, helpers
    ├── app.js        cấu hình Express
    └── server.js     khởi động server
```
