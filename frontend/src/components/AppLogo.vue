<script setup>
import { ref } from 'vue';

defineProps({
  size: { type: String, default: 'md' },
  showText: { type: Boolean, default: true },
});

const imgSrc = ref('/logo.png');

const sizes = {
  sm: { img: 'h-8 w-8', title: 'text-base', sub: 'text-[10px]' },
  md: { img: 'h-10 w-10', title: 'text-xl', sub: 'text-xs' },
  lg: { img: 'h-14 w-14', title: 'text-2xl', sub: 'text-sm' },
};

function fallbackIcon() {
  imgSrc.value = '/icon.svg';
}
</script>

<template>
  <div class="flex items-center gap-3">
    <img :src="imgSrc" alt="RemoteMatch" :class="sizes[size].img" class="rounded-2xl shadow-lg shadow-teal-900/40" @error="fallbackIcon" />
    <div v-if="showText">
      <p class="font-semibold uppercase tracking-[0.2em] text-teal-400" :class="sizes[size].sub">Remote</p>
      <p class="font-bold text-amber-300" :class="sizes[size].title">Match</p>
    </div>
  </div>
</template>
