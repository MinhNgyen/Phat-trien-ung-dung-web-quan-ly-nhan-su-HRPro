'use client';
import BarChart from '@/components/ui/BarChart';
import { avColor } from '@/lib/format';
import { BUCKETS, bucketCounts } from './payrollUtils';

// Bấm vào cột để lọc bảng bên dưới (bấm lần nữa để bỏ lọc)
export default function SalaryDistChart({ items, bucket, onSelect }) {
  const counts = bucketCounts(items);
  const data = BUCKETS.map((b, i) => ({ label: b.label, value: counts[i], color: bucket === i ? '#1d4ed8' : avColor(i) }));
  return <BarChart height={170} data={data} onBarClick={onSelect} />;
}
