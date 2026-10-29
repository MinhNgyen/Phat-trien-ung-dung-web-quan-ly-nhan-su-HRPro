# HRPro Frontend (Next.js)

Chuyển từ HTML/JS thuần sang Next.js (App Router, JavaScript). Giữ nguyên `style.css` cũ (`src/app/globals.css`)
và các endpoint backend (`NEXT_PUBLIC_API_URL`, mặc định `http://localhost:5000/api`).

## Chạy
```bash
npm install
cp .env.local.example .env.local   # sửa URL backend nếu cần
npm run dev                         # http://localhost:3000
npm test                            # chạy test logic thuần (Vitest)
```

## Cấu trúc — mỗi tính năng một thư mục
```
src/
  app/            Route Next.js (mỏng, chỉ gọi vào features/)
    login/  (app)/<từng trang>/page.js
  api/            client.js (lõi) + 1 file / nhóm endpoint
  context/        AuthContext (đăng nhập), RefsContext (cache phòng ban/ca/nhân viên/KPI)
  components/     layout/ (AppShell, Sidebar, Header), ui/ (Modal, Badges...), Can.js
  features/<tên>/ Page + bảng + form modal + <tên>Utils.js (logic thuần) + test
  lib/            constants (menu + quyền), permissions, format, csv
  hooks/          useRun (gọi API an toàn)
```

## Thêm / sửa / xóa
- **Thêm trang mới:** tạo `features/<tên>/`, tạo `src/app/(app)/<tên>/page.js`, thêm 1 dòng vào `NAV` trong `lib/constants.js` (menu + quyền).
- **Sửa quyền:** chỉ sửa `roles` trong `lib/constants.js` (menu và chặn route dùng chung một nguồn).
- **Trang không tồn tại:** Next tự hiện 404.
- **Xóa một trang:** xóa thư mục `features/<tên>`, thư mục `app/(app)/<tên>` và dòng trong `NAV`.
- **Kiểm tra:** logic nằm ở `*Utils.js` (hàm thuần) nên test không cần dựng giao diện.

## Tiến độ chuyển đổi
**Đã chuyển đủ 9/9 trang:** Dashboard, Nhân viên, Phòng ban, Ca làm việc, Chấm công, Tính lương, KPI, Báo cáo, Cài đặt
(kèm đăng nhập, phân quyền theo vai trò, huy hiệu đi muộn trên menu).

Thành phần dùng chung: `components/ui/` (Modal, BarChart, DonutChart, Badges...), `lib/deptStats.js` (gom nhân viên theo phòng ban),
`lib/charts.js` (hình học biểu đồ tròn).

## Giao diện hiện đại & thông báo
- `src/app/modern.css`: lớp giao diện bổ sung, chỉ áp dụng trong trang có class `modern` (Dashboard, Tính lương, KPI) và chuông thông báo. `style.css` cũ không bị sửa; muốn trang khác dùng giao diện này chỉ cần thêm class `modern` vào thẻ gốc của trang.
- **Chuông thông báo** (`features/notifications/`, `context/NotificationsContext.js`): tạo từ dữ liệu API sẵn có (chưa cần bảng thông báo ở backend), tự làm mới mỗi 60 giây và sau các thao tác liên quan. Trạng thái "đã đọc" lưu ở trình duyệt, theo từng tài khoản.
- **Chấm công cá nhân** (Dashboard): `features/attendance/useSelfAttendance.js` + `features/dashboard/CheckinCard.js`, dùng `POST /attendance/check-in` và `/check-out`.
- **Dashboard theo vai trò** (`features/dashboard/`): HR/Admin có `AttendanceTodayPanel` (muộn/vắng/chưa chấm công, chấm công hộ) và `KpiPendingPanel` (chấm KPI nhanh); Kế toán/Admin có `PayrollPanel` (đổi kỳ, tính, chốt/mở khóa, xem phiếu lương); Admin có thêm `AccountsPanel`. Phân vai trò ở hằng `HR_ROLES` / `FINANCE_ROLES` trong `DashboardPage.js` (thêm `manager` vào `HR_ROLES` nếu muốn quản lý cũng thấy khu HR).
- **Logic tính/chốt lương dùng chung:** hook `features/payroll/usePayrollPeriod.js` (trang Tính lương và `PayrollPanel` cùng dùng).
- **Chuông thông báo:** có tab Tất cả/Chưa đọc, nút bỏ qua từng thông báo hoặc tất cả, làm mới thủ công, xếp theo độ ưu tiên (`priority` trong `notificationUtils.js`); thông báo khác nhau theo vai trò.

