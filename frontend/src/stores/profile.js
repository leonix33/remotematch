import { defineStore } from 'pinia';
import http from '../api/http';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    loaded: false,
  }),
  getters: {
    complete: (s) => Boolean(s.profile?.complete),
  },
  actions: {
    async fetch() {
      const { data } = await http.get('/profile/me');
      this.profile = data;
      this.loaded = true;
      return data;
    },
    async save(payload) {
      const { data } = await http.patch('/profile/me', payload);
      this.profile = data;
      this.loaded = true;
      return data;
    },
    reset() {
      this.profile = null;
      this.loaded = false;
    },
  },
});
