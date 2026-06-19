<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notifications';
import { useSocket } from '../stores/socket';

const router = useRouter();
const store = useNotificationStore();
const { connect, onNotification } = useSocket();

let unsub;

onMounted(async () => {
  await store.fetch();
  connect();
  unsub = onNotification((n) => store.push(n));
});

onUnmounted(() => {
  unsub?.();
});

function openItem(n) {
  store.markRead(n._id);
  store.open = false;
  if (n.link) router.push(n.link);
}
</script>

<template>
  <div class="relative">
    <button
      class="relative rounded-xl p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200"
      @click="store.open = !store.open; store.fetch()"
    >
      🔔
      <span
        v-if="store.unread"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900"
      >
        {{ store.unread > 9 ? '9+' : store.unread }}
      </span>
    </button>

    <div
      v-if="store.open"
      class="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span class="text-sm font-medium text-slate-200">Notifications</span>
        <button class="text-xs text-teal-400" @click="store.markAllRead()">Mark all read</button>
      </div>
      <button
        v-for="n in store.items"
        :key="n._id"
        class="flex w-full flex-col gap-0.5 border-b border-slate-800/60 px-4 py-3 text-left transition hover:bg-slate-900/80"
        :class="!n.read ? 'bg-teal-500/5' : ''"
        @click="openItem(n)"
      >
        <span class="text-sm font-medium text-slate-200">{{ n.title }}</span>
        <span class="text-xs text-slate-500">{{ n.body }}</span>
      </button>
      <p v-if="!store.items.length" class="p-4 text-sm text-slate-500">No notifications</p>
    </div>
  </div>
</template>
