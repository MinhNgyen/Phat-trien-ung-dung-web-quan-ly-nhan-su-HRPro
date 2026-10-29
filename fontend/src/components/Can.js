'use client';
import { useAuth } from '@/context/AuthContext';

// Chỉ hiển thị children khi vai trò hiện tại nằm trong `roles` (thay cho data-roles trong HTML cũ)
export default function Can({ roles, children, fallback = null }) {
  const { can } = useAuth();
  return can(roles) ? children : fallback;
}
