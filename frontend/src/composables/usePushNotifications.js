import { ref, onMounted } from 'vue';
import http from '../api/http';

const supported = ref(false);
const subscribed = ref(false);
const error = ref('');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  async function subscribe() {
    error.value = '';
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      error.value = 'Push not supported in this browser';
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      error.value = 'Notification permission denied';
      return false;
    }
    const { data } = await http.get('/push/vapid-public-key');
    if (!data.configured || !data.publicKey) {
      error.value = 'Push not configured on server';
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
    await http.post('/push/subscribe', { subscription: sub.toJSON() });
    subscribed.value = true;
    return true;
  }

  onMounted(() => {
    supported.value = 'PushManager' in window && 'serviceWorker' in navigator;
  });

  return { supported, subscribed, error, subscribe };
}
