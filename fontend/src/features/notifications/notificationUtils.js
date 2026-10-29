// Logic THUẦN tạo danh sách thông báo từ dữ liệu API đã nạp (backend chưa có bảng thông báo riêng).
// id của thông báo gồm cả ngày/kỳ/số lượng -> khi tình hình thay đổi sẽ thành thông báo MỚI (chưa đọc, chưa bị bỏ qua).
// priority: số nhỏ = gấp hơn, được xếp lên đầu.
import { fmtScore } from '../../lib/format';
import { rankOf } from '../kpi/kpiUtils';

const FINANCE = ['admin', 'accountant'];

export function buildNotifications(c) {
  const { user, today, month, late = 0, absent = 0, notCheckedIn = 0, payroll = null, ownKpi = null, ownToday = null,
    missingKpi = 0, hour = 0, dayOfMonth = 1 } = c;
  const role = user && user.role;
  const list = [];

  if (user && user.employeeId && ownToday && ownToday.length === 0) {
    list.push({ id: `checkin:${today}`, priority: 1, tone: 'warning', icon: '⏰', title: 'Bạn chưa chấm công hôm nay',
      desc: 'Vào Dashboard và bấm "Chấm công vào" để ghi nhận giờ làm.', href: '/dashboard' });
  }
  if (late > 0) {
    list.push({ id: `late:${today}:${late}`, priority: 2, tone: 'warning', icon: '🕘', title: `${late} nhân viên đi muộn hôm nay`,
      desc: 'Xem chi tiết ở trang Chấm công.', href: '/attendance' });
  }
  if (absent > 0) {
    list.push({ id: `absent:${today}:${absent}`, priority: 2, tone: 'danger', icon: '🚫', title: `${absent} nhân viên vắng mặt hôm nay`,
      desc: 'Xem chi tiết ở trang Chấm công.', href: '/attendance' });
  }
  // sau 9h mà vẫn chưa có bản ghi chấm công
  if (notCheckedIn > 0 && hour >= 9) {
    list.push({ id: `not-checked-in:${today}:${notCheckedIn}`, priority: 3, tone: 'info', icon: '📋', title: `${notCheckedIn} nhân viên chưa chấm công hôm nay`,
      desc: 'Có thể chấm công hộ ngay trên Dashboard.', href: '/dashboard' });
  }
  if (payroll && payroll.items) {
    if (payroll.items.length === 0) {
      // gần cuối tháng mà kế toán chưa tính lương
      if (FINANCE.includes(role) && dayOfMonth >= 20) {
        list.push({ id: `payroll-missing:${month}`, priority: 3, tone: 'warning', icon: '🧮', title: `Chưa tính lương kỳ ${month}`,
          desc: 'Vào trang Tính lương để tính từ dữ liệu chấm công.', href: '/salary' });
      }
    } else if (payroll.isLocked) {
      list.push({ id: `payroll-locked:${month}`, priority: 6, tone: 'success', icon: '🔒', title: `Bảng lương kỳ ${month} đã được chốt`,
        desc: 'Xem phiếu lương ở trang Tính lương.', href: '/salary' });
    } else if (FINANCE.includes(role)) {
      list.push({ id: `payroll-pending:${month}`, priority: 3, tone: 'warning', icon: '🔓', title: `Bảng lương kỳ ${month} đã tính, chưa chốt`,
        desc: 'Kiểm tra số liệu rồi chốt lương.', href: '/salary' });
    } else {
      list.push({ id: `payroll:${month}`, priority: 6, tone: 'info', icon: '💰', title: `Bảng lương kỳ ${month} đã được tính`,
        desc: 'Chưa chốt — số liệu có thể còn thay đổi.', href: '/salary' });
    }
  }
  if (missingKpi > 0) {
    list.push({ id: `kpi-missing:${month}:${missingKpi}`, priority: 4, tone: 'info', icon: '📋', title: `${missingKpi} nhân viên chưa có KPI kỳ ${month}`,
      desc: 'Giao việc trên Kanban để hệ thống tự tính KPI.', href: '/performance' });
  }
  if (ownKpi) {
    list.push({ id: `kpi:${ownKpi.id}:${ownKpi.total}`, priority: 5, tone: 'success', icon: '🎯', title: `KPI kỳ ${ownKpi.period} của bạn: ${fmtScore(ownKpi.total)} điểm`,
      desc: `Xếp loại: ${rankOf(ownKpi.total).lbl}`, href: '/performance' });
  }
  return list.sort((a, b) => a.priority - b.priority); // sort ổn định: cùng mức giữ thứ tự thêm vào
}

// Thông báo còn hiển thị (chưa bị bỏ qua) và chưa đọc
export const visibleOf = (list, dismissed) => list.filter((n) => !dismissed.has(n.id));
export const unreadOf = (list, readIds) => list.filter((n) => !readIds.has(n.id));
