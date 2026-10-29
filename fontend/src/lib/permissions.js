import { NAV_ITEMS } from './constants';

// roles: 'admin,hr' hoặc ['admin','hr']
export function hasRole(user, roles) {
  if (!user) return false;
  const list = Array.isArray(roles) ? roles : String(roles).split(',').map((s) => s.trim());
  return list.includes(user.role);
}

export function findNavItem(pathname) {
  return NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/')) || null;
}

export function firstAllowedHref(user) {
  const item = NAV_ITEMS.find((i) => hasRole(user, i.roles));
  return item ? item.href : '/login';
}

// Người dùng có được mở trang href (theo NAV) không — dùng để quyết định thẻ nào bấm được
export function canOpen(user, href) {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return !!item && hasRole(user, item.roles);
}
