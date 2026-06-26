import { onBeforeUnmount, ref } from 'vue';
import { useProfileStore } from '../stores/profile';

export function useProfileAutosave({ delay = 900 } = {}) {
  const profileStore = useProfileStore();
  const saveState = ref('idle');
  let timer = null;
  let lastPayload = '';

  async function flush(getPayload) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const payload = typeof getPayload === 'function' ? getPayload() : getPayload;
    if (!payload || !Object.keys(payload).length) return;
    const key = JSON.stringify(payload);
    if (key === lastPayload && saveState.value === 'saved') return;
    saveState.value = 'saving';
    try {
      await profileStore.save(payload);
      lastPayload = key;
      saveState.value = 'saved';
      setTimeout(() => {
        if (saveState.value === 'saved') saveState.value = 'idle';
      }, 2500);
    } catch {
      saveState.value = 'error';
    }
  }

  function schedule(getPayload) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => flush(getPayload), delay);
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
  });

  return { saveState, schedule, flush };
}
