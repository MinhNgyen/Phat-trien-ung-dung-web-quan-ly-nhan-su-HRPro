import { get, post, put, tokenStore } from './client';

export const authApi = {
  hasToken: () => !!tokenStore.get(),
  async login(username, password) {
    const data = await post('/auth/login', { username, password });
    tokenStore.set(data.token);
    return data; // { token, user }
  },
  logout: () => tokenStore.clear(),
  me: () => get('/auth/me'),
  changePassword: (oldPassword, newPassword) => put('/auth/change-password', { oldPassword, newPassword }),
  users: () => get('/auth/users'),
};
