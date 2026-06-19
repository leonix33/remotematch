<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const deferredPrompt = ref(null);
const showInstall = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });

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

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall);
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
  </div>
</template>
