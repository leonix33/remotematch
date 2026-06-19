import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../api/http';

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref([]);
  const unread = ref(0);
  const open = ref(false);

  async function fetch() {
    try {
      const [listRes, countRes] = await Promise.all([
        http.get('/notifications'),
        http.get('/notifications/unread'),
      ]);
      items.value = listRes.data;
      unread.value = countRes.data.count;
    } catch {
      items.value = [];
      unread.value = 0;
    }
  }

  async function markRead(id) {
    await http.post(`/notifications/${id}/read`);
    await fetch();
  }

  async function markAllRead() {
    await http.post('/notifications/read-all');
    await fetch();
  }

  function push(item) {
    items.value.unshift(item);
    unread.value += 1;
  }

  return { items, unread, open, fetch, markRead, markAllRead, push };
});
