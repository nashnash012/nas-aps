import api from './client';

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  if (res.data && res.data.token) {
    localStorage.setItem('rcc_aps_token', res.data.token);
    localStorage.setItem('rcc_aps_user', JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await api.post('/auth/change-password', { currentPassword, newPassword });
  return res.data;
}

export function logout() {
  localStorage.removeItem('rcc_aps_token');
  localStorage.removeItem('rcc_aps_user');
}

export function getStoredToken() {
  return localStorage.getItem('rcc_aps_token');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('rcc_aps_user'));
  } catch {
    return null;
  }
}
