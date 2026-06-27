<script setup>
import { computed } from 'vue';
import { useAppShare } from '../composables/useAppShare';
import { usePwaInstall } from '../composables/usePwaInstall';
import AppLogo from './AppLogo.vue';
import { CANONICAL_APP_URL, DISPLAY_NAME } from '../constants/domain';
import { isMobileDevice, supportsHomeScreenInstall } from '../utils/device';

const {
  showPanel,
  copyMessage,
  shareUrl,
  canNativeShare,
  closePanel,
  copyLink,
  shareLink,
} = useAppShare();

const {
  installed,
  installMode,
  canOneClickInstall,
  showInstallOffer,
  installing,
  installApp,
  openSheet,
} = usePwaInstall();

const displayName = DISPLAY_NAME;
const showInstallSection = computed(() => showInstallOffer.value && !installed.value);

const installButtonLabel = computed(() => {
  if (installing.value) return 'Installing…';
  if (canOneClickInstall.value) return 'Install app — one tap';
  if (installMode.value === 'ios') return 'Add to Home Screen';
  if (installMode.value === 'in-app') return 'Open in browser to install';
  return 'Install app — one tap';
});

function close() {
  closePanel();
}

async function onInstallClick() {
  if (canOneClickInstall.value) {
    const ok = await installApp();
    if (ok) close();
    return;
  }
  closePanel();
  openSheet(true);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showPanel"
      class="share-install-overlay"
      role="dialog"
      aria-labelledby="share-install-title"
      aria-modal="true"
      @click.self="close"
    >
      <div class="share-install-sheet safe-bottom">
        <div class="share-install-handle" aria-hidden="true" />
        <button type="button" class="share-install-close" aria-label="Close" @click="close">×</button>

        <div class="share-install-hero">
          <AppLogo size="sm" variant="compact" />
        </div>
        <h2 id="share-install-title" class="share-install-title">{{ displayName }}</h2>
        <p class="share-install-subtitle">
          Install on your phone or share <strong class="text-teal-300">{{ CANONICAL_APP_URL.replace('https://', '') }}</strong> — no account needed.
        </p>

        <!-- Install first -->
        <section v-if="showInstallSection" class="share-install-section share-install-section-first">
          <p class="share-install-section-label">Install {{ displayName }}</p>

          <button
            type="button"
            class="btn-primary pwa-install-cta"
            :disabled="installing"
            @click="onInstallClick"
          >
            {{ installButtonLabel }}
          </button>

          <p v-if="canOneClickInstall" class="share-install-hint">
            Chrome / Edge / Samsung — adds the app icon to your home screen instantly.
          </p>
          <p v-else-if="installMode === 'ios' && supportsHomeScreenInstall()" class="share-install-hint">
            iPhone: tap the button above for steps — Share → Add to Home Screen → Add.
            <span class="block mt-1 text-slate-500">(Apple does not allow one-tap install from websites.)</span>
          </p>
          <p v-else-if="installMode === 'in-app'" class="share-install-hint">
            You’re in an in-app browser. Open {{ CANONICAL_APP_URL }} in Safari or Chrome, then tap Install.
          </p>
          <p v-else-if="installMode === 'android'" class="share-install-hint">
            If the button opens steps, use Chrome menu ⋮ → Install app.
          </p>
        </section>

        <section v-else-if="installed" class="share-install-section share-install-section-first">
          <p class="share-install-installed">✓ {{ displayName }} is on your home screen.</p>
        </section>

        <!-- Share URL -->
        <section class="share-install-section">
          <p class="share-install-section-label">Share URL</p>
          <div class="share-install-url-box">
            <code class="share-install-url">{{ shareUrl || CANONICAL_APP_URL }}</code>
          </div>
          <div class="share-install-actions-row">
            <button type="button" class="btn-primary flex-1" @click="copyLink">
              {{ copyMessage || 'Copy link' }}
            </button>
            <button
              v-if="canNativeShare"
              type="button"
              class="btn-secondary flex-1"
              @click="shareLink"
            >
              Share…
            </button>
          </div>
          <p v-if="copyMessage" class="share-install-feedback">{{ copyMessage }}</p>
          <p v-else-if="!isMobileDevice()" class="share-install-hint">
            Send this link to your phone, open in Chrome or Safari, then tap Install.
          </p>
        </section>

        <button type="button" class="btn-secondary mt-4 w-full" @click="close">Done</button>
      </div>
    </div>
  </Teleport>
</template>
