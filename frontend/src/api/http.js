import axios from 'axios';
import { clearAuthStorage } from '../utils/authStorage';

const http = axios.create({ baseURL: '/api', withCredentials: true });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      let userId = null;
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        userId = user?.id;
      } catch {
        /* ignore */
      }
      clearAuthStorage(userId);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default http;
