'use client';
import { useCallback, useState } from 'react';

/**
 * Chạy 1 hàm async: bật busy, bắt lỗi và báo bằng alert (giữ hành vi cũ của run() trong core.js).
 * Trả về kết quả của fn, hoặc undefined nếu có lỗi. Lỗi 401 do AuthContext xử lý (về trang đăng nhập).
 * Sau này muốn đổi alert -> toast chỉ cần sửa đúng một chỗ này.
 */
export function useRun() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, failMsg) => {
    setBusy(true);
    try {
      return await fn();
    } catch (err) {
      if (err.status === 401) return undefined;
      console.error(err);
      alert(err.message || failMsg || 'Có lỗi xảy ra, vui lòng thử lại.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { run, busy };
}
