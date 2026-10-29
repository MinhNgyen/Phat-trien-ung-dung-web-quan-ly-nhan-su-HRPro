'use client';
import { useRefs } from '@/context/RefsContext';

export default function DeptTag({ dept }) {
  const { deptById } = useRefs();
  if (!dept) return <span className="badge badge-gray">Chưa có</span>;
  const c = dept.color || (deptById(dept.id) || {}).color || '#94a3b8';
  return <span className="dept-tag" style={{ background: `${c}22`, color: c }}>{dept.name}</span>;
}
