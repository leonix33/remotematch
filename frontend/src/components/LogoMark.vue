<script setup>
defineProps({
  size: { type: [Number, String], default: 40 },
  className: { type: String, default: '' },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
    role="img"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="rm-logo-bg" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0f172a" />
        <stop offset="1" stop-color="#134e4a" />
      </linearGradient>
      <linearGradient id="rm-logo-glow" x1="160" y1="120" x2="360" y2="392" gradientUnits="userSpaceOnUse">
        <stop stop-color="#14b8a6" />
        <stop offset="1" stop-color="#2dd4bf" />
      </linearGradient>
      <linearGradient id="rm-logo-gold" x1="200" y1="180" x2="312" y2="340" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fbbf24" />
        <stop offset="1" stop-color="#f59e0b" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#rm-logo-bg)" />
    <circle cx="256" cy="256" r="168" stroke="url(#rm-logo-glow)" stroke-width="6" opacity="0.35" />
    <circle cx="256" cy="256" r="120" stroke="url(#rm-logo-glow)" stroke-width="10" opacity="0.55" />
    <path d="M256 136 L256 376 M136 256 L376 256" stroke="#14b8a6" stroke-width="4" opacity="0.25" />
    <circle cx="176" cy="200" r="28" fill="#0f172a" stroke="url(#rm-logo-glow)" stroke-width="8" />
    <circle cx="336" cy="200" r="28" fill="#0f172a" stroke="url(#rm-logo-glow)" stroke-width="8" />
    <circle cx="256" cy="320" r="32" fill="#0f172a" stroke="url(#rm-logo-gold)" stroke-width="10" />
    <path d="M200 210 C228 248 284 248 312 210" stroke="url(#rm-logo-gold)" stroke-width="10" stroke-linecap="round" />
    <circle cx="256" cy="256" r="14" fill="url(#rm-logo-gold)" />
  </svg>
</template>
