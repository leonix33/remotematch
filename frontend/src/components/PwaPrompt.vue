<script setup>
import { onMounted, ref } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { usePushNotifications } from '../composables/usePushNotifications';

const deferredPrompt = ref(null);
const showInstall = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
const { supported, subscribed, error, subscribe } = usePushNotifications();
const showPush = ref(false);

function onBeforeInstall(e) {
  e.preventDefault();
  deferredPrompt.value = e;
  showInstall.value = true;
}

async function install() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  await deferredPrompt.value.userChoice;
  deferredPrompt.value = null;
  showInstall.value = false;
}

function refresh() {
  updateServiceWorker(true);
}

async function enablePush() {
  const ok = await subscribe();
  if (ok) showPush.value = false;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  if (supported.value && Notification.permission === 'default') {
    showPush.value = true;
  }
});
</script>

<template>
  <div class="fixed inset-x-0 z-50 flex flex-col gap-2 px-4" style="top: env(safe-area-inset-top, 0);">
    <div
      v-if="needRefresh"
      class="flex items-center justify-between gap-3 rounded-xl border border-teal-700/50 bg-slate-900/95 px-4 py-3 text-sm shadow-lg backdrop-blur"
    >
      <span class="text-slate-200">Update available</span>
      <button class="btn-primary shrink-0 py-1.5 text-sm" @click="refresh">Reload</button>
    </div>
    <div
      v-if="showInstall"
      class="flex items-center justify-between gap-3 rounded-xl border border-amber-700/50 bg-slate-900/95 px-4 py-3 text-sm shadow-lg backdrop-blur"
    >
      <span class="text-slate-200">Install RemoteMatch on your phone</span>
      <button class="btn-primary shrink-0 py-1.5 text-sm" @click="install">Install</button>
    </div>
    <div
      v-if="showPush && !subscribed"
      class="flex items-center justify-between gap-3 rounded-xl border border-teal-700/50 bg-slate-900/95 px-4 py-3 text-sm shadow-lg backdrop-blur"
    >
      <span class="text-slate-200">Enable push for matches &amp; messages</span>
      <button class="btn-primary shrink-0 py-1.5 text-sm" @click="enablePush">Enable</button>
    </div>
    <p v-if="error" class="text-center text-xs text-red-300">{{ error }}</p>
  </div>
</template>
