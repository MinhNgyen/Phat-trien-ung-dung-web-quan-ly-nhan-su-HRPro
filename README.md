# HRPro — Hệ thống quản lý nhân sự

Ứng dụng web quản lý nhân sự: nhân viên, phòng ban, ca làm việc, chấm công, tính lương, giao việc (Kanban) và **KPI tự tính từ đầu việc**.

Gồm 2 phần:

| Thư mục | Vai trò | Công nghệ |
|---|---|---|
| [`fontend/`](fontend/) | Giao diện (tên thư mục giữ nguyên chính tả hiện có) | Next.js 15, React 19, Vitest |
| [`backend/`](backend/) | REST API | Node.js, Express, Prisma, MySQL, Jest |

Tài liệu chi tiết API: [`backend/README.md`](backend/README.md).  
Tài liệu frontend: [`fontend/README.md`](fontend/README.md).  
Swagger (khi backend đang chạy): `http://localhost:5001/api-docs`.

---

## 1. Yêu cầu

- Node.js >= 18
- npm
- MySQL 8 (máy local **hoặc** Docker)
- (Tuỳ chọn) Docker + Docker Compose để chạy MySQL/backend

---

## 2. Cổng mặc định

| Dịch vụ | Local (`.env`) | Docker Compose |
|---|---|---|
| Frontend Next.js | `http://localhost:3000` | — (chạy trên máy) |
| Backend API | **`http://localhost:5001`** | `http://localhost:5000` |
| Swagger | `http://localhost:5001/api-docs` | `http://localhost:5000/api-docs` |
| MySQL | cổng trong `DATABASE_URL` | **3307** → 3306 trong container |

Frontend gọi `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:5001/api`).  
Nếu biến môi trường còn trỏ `localhost:5000`, client tự đổi sang `5001` để khớp backend local.

---

## 3. Chạy local

### 3.1 MySQL

Tạo database:

```sql
CREATE DATABASE hrpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hoặc chỉ chạy MySQL bằng Docker:

```bash
docker compose up -d hrpro-mysql
```

Cổng host là **3307**.

### 3.2 Backend

```bash
cd backend
npm install
cp .env.example .env
```

Sửa `.env` cho khớp MySQL. Ví dụ khi dùng Docker MySQL ở 3307:

```
PORT=5001
DATABASE_URL="mysql://root:rootpassword@localhost:3307/hrpro"
JWT_SECRET="change_this_secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
CORS_ORIGIN="*"
```

```bash
npx prisma migrate dev
npm run seed
npm run dev
```

Kiểm tra: `GET http://localhost:5001/api/health`

```json
{ "success": true, "message": "HRPro Backend is running" }
```

### 3.3 Frontend

```bash
cd fontend
npm install
```

File [`fontend/.env.local`](fontend/.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

```bash
npm run dev
```

Mở `http://localhost:3000` → trang đăng nhập.

---

## 4. Docker (backend + MySQL)

Từ thư mục gốc:

```bash
docker compose up -d --build
docker compose exec hrpro-backend npm run seed
```

- API: `http://localhost:5000`
- MySQL map ra **3307**
- Trong container, `DATABASE_URL` dùng hostname `hrpro-mysql`, không dùng `localhost`

Frontend vẫn chạy trên máy (`cd fontend && npm run dev`) và lúc đó cần:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 5. Tài khoản mẫu (sau `npm run seed`)

Mật khẩu được hash bcrypt và **reset mỗi lần seed**.

| Username | Password | Role | Nhân viên gắn với TK |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | — |
| `hr123` | `hr123456` | HR | NV016 Phạm Thu Hà |
| `ketoan` | `ketoan123` | ACCOUNTANT | NV020 Đỗ Văn Nam |
| `quanly` | `quanly123` | MANAGER | NV001 Nguyễn Văn An |
| `nhanvien` | `nhanvien123` | EMPLOYEE | NV002 Trần Quốc Bảo |

Seed còn tạo phòng ban, ca, nhân viên, chấm công năm 2026, đầu việc từng tháng, rồi **tính KPI từ việc**.

---

## 6. Vai trò

| Role | Việc được làm |
|---|---|
| **ADMIN** | Toàn hệ thống: tài khoản, nhân sự, chấm công, lương, giao/duyệt việc, KPI, cài đặt |
| **HR** | Nhân viên, phòng ban, ca, chấm công, giao/duyệt việc, xem KPI |
| **MANAGER** | Xem nhân viên, chấm công, giao/duyệt việc, KPI |
| **ACCOUNTANT** | Tính / chốt lương, xem nhân sự (đọc), xem việc/KPI (đọc) |
| **EMPLOYEE** | Chấm công bản thân, xem lương/KPI của mình, cập nhật việc của mình (`TODO` → `IN_PROGRESS` → `REVIEW`) — **không tự DONE** |

Menu + chặn route dùng chung một nguồn: [`fontend/src/lib/constants.js`](fontend/src/lib/constants.js) (`NAV`).  
Backend chặn theo role: [`backend/src/middlewares/role.middleware.js`](backend/src/middlewares/role.middleware.js).

---

## 7. Tính năng theo trang

| Route | Trang | Nội dung |
|---|---|---|
| `/login` | Đăng nhập | JWT; gợi ý tài khoản demo |
| `/dashboard` | Tổng quan | Số liệu, chấm công vào/ra, biểu đồ phòng ban. HR/Admin/Manager: chấm công hôm nay + hàng chờ duyệt việc. Kế toán/Admin: panel lương. Admin: tài khoản |
| `/employees` | Nhân viên | CRUD, gắn ca, lọc phòng ban |
| `/departments` | Phòng ban | CRUD (không xoá khi còn nhân viên) |
| `/shifts` | Ca làm việc | CRUD, giờ `HH:mm`, phút cho phép muộn |
| `/attendance` | Chấm công | Lịch / bảng, chấm hộ, chi tiết. Nhân viên: của mình |
| `/salary` | Tính lương | Tính theo kỳ, phiếu lương, chốt / mở khóa |
| `/performance` | Việc + KPI | Tab **Đầu việc** (Kanban) và **Kết quả KPI**. Giao việc, duyệt, xem công thức |
| `/reports` | Báo cáo | Xuất CSV nhân viên / chấm công / lương / KPI |
| `/settings` | Cài đặt | Chỉ admin: công ty, cấu hình lương, tài khoản |

Chuông thông báo (client): tạo từ dữ liệu API sẵn có, làm mới ~60 giây, trạng thái đã đọc lưu trên trình duyệt theo tài khoản — [`fontend/src/features/notifications/`](fontend/src/features/notifications/).

---

## 8. Đầu việc và KPI

KPI **không nhập tay**. Mỗi lần thêm / sửa / xoá việc, backend tính lại KPI của (nhân viên, kỳ).

**Quy trình việc**

```
TODO → IN_PROGRESS → REVIEW (nhân viên báo xong) → DONE (quản lý duyệt + chấm quality 0–100)
                                                      CANCELLED (bỏ qua, không tính KPI)
```

- Giao việc: Admin / HR / Manager — `POST /api/tasks` (`title`, `employeeId`, `dueDate`, `weight` 1–5).
- Nhân viên: `PATCH /api/tasks/:id/status` chỉ `TODO` | `IN_PROGRESS` | `REVIEW`.
- Duyệt xong: quản lý `PUT` với `status: DONE` và `quality`.

**Kỳ KPI** = tháng của `dueDate` (`YYYY-MM`).

**Công thức** ([`backend/src/services/kpi.service.js`](backend/src/services/kpi.service.js), frontend xem trước cùng công thức trong [`fontend/src/features/kpi/kpiUtils.js`](fontend/src/features/kpi/kpiUtils.js)):

```
completionRate = Σ weight(DONE)                         / Σ weight(mọi việc trừ hủy)  × 100
onTimeRate     = Σ weight(DONE và completedAt ≤ dueDate) / Σ weight(DONE)               × 100
qualityScore   = Σ weight × quality (DONE)               / Σ weight(DONE)
total          = 40% completionRate + 30% onTimeRate + 30% qualityScore
```

Việc chưa xong nằm ở mẫu số `completionRate` → KPI tháng đang chạy là KPI tạm tính. Không còn việc nào trong kỳ thì không có dòng KPI.

Xếp loại: ≥ 90 Xuất sắc · ≥ 80 Tốt · ≥ 70 Khá · dưới 70 Cần cải thiện.

---

## 9. Tính lương

Cấu hình công ty (singleton `payroll_settings` id=1): phụ cấp ăn/xăng/điện thoại, hệ số OT, % BHXH/BHYT/BHTN, giảm trừ gia cảnh, ngày công chuẩn, phạt đi muộn / lần.

Công thức ([`backend/src/services/payroll.service.js`](backend/src/services/payroll.service.js)):

```
ngày công     = số bản ghi PRESENT + LATE trong tháng
lương cơ bản  = lương / standardDays × ngày công
OT            = giờ vượt ca (hoặc type OVERTIME) × (lương / standardDays / 8) × hệ số OT
phụ cấp       = ăn + xăng + điện thoại + phụ cấp nhập khi tính
khấu trừ      = BH (BHXH+BHYT+BHTN)% × lương cơ bản + số lần LATE × phạt + khấu trừ khác
gross         = lương cơ bản + OT + phụ cấp − khấu trừ
thuế TNCN     = max(0, gross − giảm trừ) × 10%
net           = gross − thuế
```

Chốt kỳ: `POST /api/payroll/lock` — sau đó không tính/sửa/xoá. Mở khóa: chỉ ADMIN.

---

## 10. API (tóm tắt)

Prefix: `/api`. Header: `Authorization: Bearer <token>` (trừ `/auth/login` và `/health`).

Response:

```json
{ "success": true, "message": "...", "data": {} }
```

Lỗi: `{ "success": false, "message": "...", "errors": [] }` — HTTP 400, 401, 403, 404, 409, 500.

| Nhóm | Base | Ghi chú |
|---|---|---|
| Auth | `/auth` | login, me, đổi mật khẩu, đăng ký user (ADMIN) |
| Nhân viên | `/employees` | CRUD + gắn ca |
| Phòng ban | `/departments` | CRUD |
| Ca | `/shifts` | CRUD |
| Chấm công | `/attendance` | CRUD, check-in / check-out |
| Lương | `/payroll` | tính, sửa, khóa / mở |
| Việc | `/tasks` | CRUD, PATCH status |
| KPI | `/kpi` | list / theo NV / `POST /kpi/recalculate` |
| Báo cáo | `/reports` | dashboard, nhân viên, công, lương, KPI |
| Cài đặt | `/settings/payroll` | singleton cấu hình lương |

Chi tiết body/query: [`backend/README.md`](backend/README.md) mục 6.  
Gọi thử nhanh: [`backend/tests/hrpro.http`](backend/tests/hrpro.http) (REST Client). Đổi `@host` thành `http://localhost:5001/api` khi chạy local.

---

## 11. Cấu trúc thư mục

```
hr-pro/
├── docker-compose.yml          MySQL 3307 + backend (Docker PORT 5000)
├── README.md                   file này
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       User, Employee, Department, Shift, Attendance,
│   │   │                       Task, Kpi, Payroll, PayrollSetting, SalaryLock
│   │   ├── seed.js             dữ liệu + tài khoản mẫu
│   │   └── migrations/
│   ├── src/
│   │   ├── server.js           PORT (mặc định 5001)
│   │   ├── app.js              Express, CORS, Swagger, /api
│   │   ├── config/             Prisma, Swagger
│   │   ├── routes/             1 file / nhóm endpoint
│   │   ├── controllers/
│   │   ├── services/           auth, payroll, kpi (computeFromTasks), report
│   │   ├── validators/         Zod
│   │   ├── middlewares/        JWT, role, validate, error
│   │   └── utils/
│   ├── tests/hrpro.http
│   └── jest.config.js          unit test (không cần DB)
└── fontend/                    ← đúng tên thư mục trong repo
    ├── src/
    │   ├── app/                App Router (mỏng, gọi vào features/)
    │   ├── api/                client.js + 1 file / nhóm endpoint
    │   ├── context/            Auth, Refs (cache NV/phòng/ca/KPI), thông báo
    │   ├── components/         layout + ui + Can
    │   ├── features/<tên>/     Page, bảng, modal, *Utils.js, *.test.js
    │   ├── lib/                NAV, quyền, format, csv
    │   └── hooks/              useRun
    └── .env.local
```

Thêm trang mới: tạo `fontend/src/features/<tên>/`, thêm `src/app/(app)/<tên>/page.js`, thêm 1 dòng vào `NAV` trong [`fontend/src/lib/constants.js`](fontend/src/lib/constants.js).

---

## 12. Kiểm thử

Logic thuần nằm ở `*Utils.js` (frontend) và hàm thuần backend (KPI, Zod, `monthRange`). Test **không cần** dựng UI hay MySQL.

```bash
# Frontend — Vitest
cd fontend
npm test

# Backend — Jest (file **/src/**/*.test.js)
cd backend
npm test
# hoặc
npm run test:unit
```

| Gói | File test |
|---|---|
| Frontend | `src/api/client.test.js` (URL API / cổng 5000→5001, query string) |
| | `src/features/tasks/taskUtils.test.js` |
| | `src/features/kpi/kpiUtils.test.js` |
| | `src/features/notifications/notificationUtils.test.js` |
| | `src/features/payroll/payrollUtils.test.js` |
| | `src/features/attendance/attendanceUtils.test.js` |
| | `src/features/dashboard/dashboardUtils.test.js` |
| | `src/features/employees/employeeUtils.test.js` |
| | `src/features/departments/departmentUtils.test.js` |
| | `src/features/shifts/shiftUtils.test.js` |
| | `src/features/reports/reportUtils.test.js` |
| | `src/features/settings/settingsUtils.test.js` |
| | `src/lib/charts.test.js`, `src/lib/permissions.test.js` |
| Backend | `src/services/kpi.service.test.js` — cùng công thức 40/30/30 với frontend |
| | `src/validators/task.validator.test.js` — nhân viên không được tự DONE |
| | `src/utils/helpers.test.js` — `monthRange` |

---

## 13. NPM scripts

**backend**

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | nodemon `src/server.js` |
| `npm start` | production |
| `npm run seed` | nạp dữ liệu mẫu |
| `npm run prisma:generate` | sinh Prisma Client |
| `npm run prisma:migrate` | migrate |
| `npm run prisma:studio` | xem DB |
| `npm test` / `npm run test:unit` | Jest |

**fontend**

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Next.js `http://localhost:3000` |
| `npm run build` / `npm start` | production |
| `npm test` | `vitest run` |

---

## 14. Mô hình dữ liệu (Prisma)

[`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- **User** — username, password hash, `Role` (`ADMIN` `HR` `ACCOUNTANT` `MANAGER` `EMPLOYEE`)
- **Employee** ↔ User (1-1), Department, Shift (n-n qua `employee_shifts`)
- **Attendance** — unique (nhân viên, ca, ngày); status PRESENT/LATE/ABSENT/LEAVE
- **Task** — `dueDate` quyết định kỳ KPI; `weight` 1–5; `quality` khi DONE
- **Kpi** — unique (nhân viên, period `YYYY-MM`); luôn tính lại từ Task
- **Payroll** — unique (nhân viên, month); **SalaryLock** khóa kỳ
- **PayrollSetting** — 1 dòng id=1

---

## 15. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| `GET /api/tasks` **404** trên `localhost:5000` | Frontend đang gọi cổng 5000, backend local là **5001**. Đặt `NEXT_PUBLIC_API_URL=http://localhost:5001/api`, restart `npm run dev` của Next |
| Alert `Loi he thong, vui long thu lai sau` | 500 từ backend (thường schema KPI cũ, hoặc process cũ). Chạy `npx prisma migrate dev` rồi restart backend |
| Kanban trống dù API 200 | Chưa seed việc, hoặc đang xem kỳ không có `dueDate`. `cd backend && npm run seed` |
| `Can't reach database server` | MySQL chưa chạy / sai cổng (`3306` vs `3307`) |
| `P1003: Database hrpro does not exist` | Tạo DB utf8mb4 |
| `Cannot find module '@prisma/client'` | `npx prisma generate` |
| Token hết hạn → 401 | Đăng nhập lại |
| Frontend bị CORS | `CORS_ORIGIN=*` khi dev |
| Chữ Việt `?????` | DB không utf8mb4 |

---

## 16. Tài liệu khác trong repo

- [`backend/README.md`](backend/README.md) — endpoint, body, công thức, Docker, lỗi
- [`fontend/README.md`](fontend/README.md) — cấu trúc Next.js, cách thêm/sửa trang
- [`backend/tests/hrpro.http`](backend/tests/hrpro.http) — gọi API từ VS Code
- `Bao_Cao_HRPro_Final.docx`, `HRPro_Thuyet_Trinh.pptx` — báo cáo / thuyết trình
