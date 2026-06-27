import { computed, ref } from 'vue';
import { brand } from '../brand';
import { CANONICAL_APP_URL, DISPLAY_NAME, resolveShareUrl } from '../constants/domain';

const showPanel = ref(false);
const copyMessage = ref('');

export function useAppShare() {
  const shareUrl = computed(() => resolveShareUrl());

  const canNativeShare = computed(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  );

  function openPanel() {
    showPanel.value = true;
    copyMessage.value = '';
  }

  function closePanel() {
    showPanel.value = false;
  }

  async function copyLink() {
    const url = shareUrl.value || CANONICAL_APP_URL;
    try {
      await navigator.clipboard.writeText(url);
      copyMessage.value = 'Link copied!';
      return true;
    } catch {
      try {
        const input = document.createElement('textarea');
        input.value = url;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        copyMessage.value = 'Link copied!';
        return true;
      } catch {
        copyMessage.value = 'Could not copy — select the link below';
        return false;
      }
    }
  }

  async function shareLink() {
    const url = shareUrl.value || CANONICAL_APP_URL;
    if (canNativeShare.value) {
      try {
        await navigator.share({
          title: DISPLAY_NAME,
          text: `${DISPLAY_NAME} — ${brand.tagline}`,
          url,
        });
        copyMessage.value = '';
        return true;
      } catch (err) {
        if (err?.name === 'AbortError') return false;
      }
    }
    return copyLink();
  }

  return {
    showPanel,
    copyMessage,
    shareUrl,
    canNativeShare,
    openPanel,
    closePanel,
    copyLink,
    shareLink,
  };
}
