'use client';
import { useCallback, useRef } from 'react';
import { settingsApi } from '@/api/settings';

// Tên công ty trên phiếu lương lấy từ cấu hình; nhân viên thường không có quyền xem cấu hình -> dùng tên mặc định
export function useCompanyName() {
  const cache = useRef(null);
  return useCallback(async () => {
    if (cache.current) return cache.current;
    try { cache.current = (await settingsApi.getPayroll()).company || 'HRPro'; }
    catch (e) { cache.current = 'HRPro'; }
    return cache.current;
  }, []);
}
