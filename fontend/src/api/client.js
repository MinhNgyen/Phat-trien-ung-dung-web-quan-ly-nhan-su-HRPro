/**
 * Lõi gọi API: gắn token, đọc { success, data, message }, ném Error có message tiếng Việt từ backend.
 * Khi gặp 401 -> xóa token và phát sự kiện để AuthContext đưa người dùng về trang đăng nhập.
 * Backend .env dùng PORT=5001; Next có thể đã inline localhost:5000 lúc start — đổi sang 5001.
 */
export function resolveApiUrl(raw) {
  return String(raw || 'http://localhost:5001/api').replace(/localhost:5000\b/, 'localhost:5001');
}
export const API_URL = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL);
export const UNAUTHORIZED_EVENT = 'hrpro:unauthorized';
const TOKEN_KEY = 'hrpro_token';
const isBrowser = typeof window !== 'undefined';

export const tokenStore = {
  get: () => (isBrowser ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t) => { if (isBrowser) localStorage.setItem(TOKEN_KEY, t); },
  clear: () => { if (isBrowser) localStorage.removeItem(TOKEN_KEY); },
};

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (e) {
    throw new Error('Không kết nối được tới server. Kiểm tra backend đã chạy chưa?');
  }

  let json = {};
  try { json = await res.json(); } catch (e) { /* response rỗng */ }

  if (res.status === 401) {
    tokenStore.clear();
    if (isBrowser) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const err = new Error(json.message || 'Phiên đăng nhập đã hết hạn');
    err.status = 401;
    throw err;
  }
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `Lỗi ${res.status}`);
    err.errors = json.errors || [];
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export const get = (p) => request(p);
export const post = (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) });
export const put = (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) });
export const patch = (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) });
export const del = (p) => request(p, { method: 'DELETE' });

// Ghép query string, bỏ qua giá trị rỗng
export function qs(params = {}) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return usable.length ? `?${new URLSearchParams(usable).toString()}` : '';
}
