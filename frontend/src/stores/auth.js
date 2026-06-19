import { defineStore } from 'pinia';
import http from '../api/http';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('accessToken'),
  }),
  getters: {
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    async login(email, password) {
      const { data } = await http.post('/auth/login', { email, password });
      this.user = data.user;
      this.accessToken = data.accessToken;
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
    },
    logout() {
      this.user = null;
      this.accessToken = null;
      localStorage.clear();
    },
  },
});
