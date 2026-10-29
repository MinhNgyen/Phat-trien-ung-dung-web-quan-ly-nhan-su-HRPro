'use client';
import { useEffect, useState } from 'react';

// Trả về thời điểm hiện tại, cập nhật mỗi giây (cho đồng hồ trên Dashboard)
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
