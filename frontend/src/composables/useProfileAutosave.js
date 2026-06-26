import { onBeforeUnmount, ref } from 'vue';
import { useProfileStore } from '../stores/profile';
import { isUnreadableResumeText } from '../utils/resumeText';

export function useProfileAutosave({ delay = 900 } = {}) {
  const profileStore = useProfileStore();
  const saveState = ref('idle');
  let timer = null;
  let lastPayload = '';

  function cleanPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    if (payload.resumeText && isUnreadableResumeText(payload.resumeText)) {
      const { resumeText, ...rest } = payload;
      return rest;
    }
    return payload;
  }

  async function flush(getPayload) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const payload = cleanPayload(typeof getPayload === 'function' ? getPayload() : getPayload);
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
