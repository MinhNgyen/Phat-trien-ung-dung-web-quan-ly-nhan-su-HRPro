import { describe, it, expect } from 'vitest';
import { findNavItem, firstAllowedHref, hasRole } from './permissions';

describe('permissions', () => {
  it('hasRole nhận chuỗi hoặc mảng', () => {
    expect(hasRole({ role: 'hr' }, 'admin,hr')).toBe(true);
    expect(hasRole({ role: 'employee' }, ['admin', 'hr'])).toBe(false);
    expect(hasRole(null, 'admin')).toBe(false);
  });
  it('findNavItem khớp route con', () => { expect(findNavItem('/employees/12').href).toBe('/employees'); });
  it('trang đầu tiên được phép', () => {
    expect(firstAllowedHref({ role: 'accountant' })).toBe('/dashboard');
  });
});

import { canOpen } from './permissions';

describe('canOpen', () => {
  it('theo quyền của từng trang trong NAV', () => {
    expect(canOpen({ role: 'accountant' }, '/salary')).toBe(true);
    expect(canOpen({ role: 'accountant' }, '/employees')).toBe(false);
    expect(canOpen({ role: 'employee' }, '/attendance')).toBe(true);
    expect(canOpen({ role: 'admin' }, '/khong-ton-tai')).toBe(false);
  });
});
