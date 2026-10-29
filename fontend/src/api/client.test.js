import { describe, it, expect } from 'vitest';
import { qs, resolveApiUrl } from './client';

describe('resolveApiUrl', () => {
  it('mặc định cổng 5001', () => {
    expect(resolveApiUrl()).toBe('http://localhost:5001/api');
    expect(resolveApiUrl('')).toBe('http://localhost:5001/api');
  });
  it('giữ URL đã đúng cổng 5001', () => {
    expect(resolveApiUrl('http://localhost:5001/api')).toBe('http://localhost:5001/api');
  });
  it('đổi cổng 5000 cũ sang 5001 (lỗi 404 /tasks)', () => {
    expect(resolveApiUrl('http://localhost:5000/api')).toBe('http://localhost:5001/api');
  });
  it('không đụng host khác', () => {
    expect(resolveApiUrl('http://api.example.com:5000/api')).toBe('http://api.example.com:5000/api');
  });
});

describe('qs', () => {
  it('bỏ query rỗng, ghép period', () => {
    expect(qs({})).toBe('');
    expect(qs({ period: '2026-10' })).toBe('?period=2026-10');
    expect(qs({ period: '2026-10', status: '', q: null })).toBe('?period=2026-10');
  });
});
