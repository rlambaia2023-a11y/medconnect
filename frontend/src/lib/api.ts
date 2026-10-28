import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mc_token');
      localStorage.removeItem('mc_user');
    }
    return Promise.reject(err);
  }
);

export function setAuth(token: string, user: any) {
  localStorage.setItem('mc_token', token);
  localStorage.setItem('mc_user', JSON.stringify(user));
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('mc_user') || 'null'); } catch { return null; }
}
export function getToken() { return localStorage.getItem('mc_token'); }
export function logout() { localStorage.removeItem('mc_token'); localStorage.removeItem('mc_user'); }