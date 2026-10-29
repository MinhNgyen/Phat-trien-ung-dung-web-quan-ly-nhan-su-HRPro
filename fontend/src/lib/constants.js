const ALL = ['admin', 'hr', 'accountant', 'manager', 'employee'];

export const ROLES = {
  admin: { label: 'Quản trị viên', scope: 'Toàn hệ thống' },
  hr: { label: 'Nhân sự (HR)', scope: 'Nhân viên, phòng ban, chấm công' },
  accountant: { label: 'Kế toán', scope: 'Tính lương, chốt lương' },
  manager: { label: 'Quản lý', scope: 'Nhân viên, KPI, chấm công' },
  employee: { label: 'Nhân viên', scope: 'Xem thông tin cá nhân' },
};

/**
 * Menu + phân quyền route nằm CHUNG một chỗ: thêm/sửa/xóa một trang chỉ cần sửa mảng này.
 * (Trước đây rải ở data-roles trong HTML và navigate() trong core.js)
 */
export const NAV = [
  { section: 'Tổng quan', roles: ALL, items: [
    { href: '/dashboard', icon: '📊', label: 'Dashboard', title: 'Dashboard', roles: ALL },
  ] },
  { section: 'Nhân sự', roles: ['admin', 'hr', 'manager'], items: [
    { href: '/employees', icon: '👥', label: 'Nhân viên', title: 'Quản lý Nhân viên', roles: ['admin', 'hr', 'manager'] },
    { href: '/departments', icon: '🏢', label: 'Phòng ban', title: 'Phòng ban', roles: ['admin', 'hr'] },
    { href: '/shifts', icon: '📅', label: 'Ca làm việc', title: 'Ca làm việc', roles: ['admin', 'hr'] },
  ] },
  { section: 'Vận hành', roles: ALL, items: [
    { href: '/attendance', icon: '✅', label: 'Chấm công', title: 'Chấm công', roles: ['admin', 'hr', 'manager', 'employee'] },
    { href: '/salary', icon: '💰', label: 'Tính lương', title: 'Tính lương', roles: ['admin', 'accountant', 'employee'] },
    { href: '/performance', icon: '🎯', label: 'Hiệu suất KPI', title: 'Hiệu suất & KPI', roles: ['admin', 'hr', 'manager', 'employee'] },
  ] },
  { section: 'Phân tích', roles: ['admin', 'hr', 'accountant', 'manager'], items: [
    { href: '/reports', icon: '📈', label: 'Báo cáo & Thống kê', title: 'Báo cáo & Thống kê', roles: ['admin', 'hr', 'accountant', 'manager'] },
    { href: '/settings', icon: '⚙️', label: 'Cài đặt', title: 'Cài đặt', roles: ['admin'] },
  ] },
];

export const NAV_ITEMS = NAV.flatMap((s) => s.items);
