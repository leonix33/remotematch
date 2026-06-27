<script setup>
import { useAppShare } from '../composables/useAppShare';

const { openPanel } = useAppShare();
</script>

<template>
  <button
    type="button"
    class="share-install-tab safe-top"
    aria-label="Share link and install app"
    title="Share & install"
    @click="openPanel"
  >
    <span class="share-install-tab-icon" aria-hidden="true">⬆</span>
    <span class="share-install-tab-text">Share</span>
    <span class="share-install-tab-text share-install-tab-text-sub">Install</span>
  </button>
</template>
