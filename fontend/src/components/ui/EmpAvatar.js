import { avColor, initials } from '@/lib/format';

export default function EmpAvatar({ employee }) {
  return <div className="emp-avatar" style={{ background: avColor(employee.id) }}>{initials(employee.name)}</div>;
}
