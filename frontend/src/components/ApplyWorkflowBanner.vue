<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="rounded-xl border border-teal-900/40 bg-slate-900/50 p-4">
    <p class="text-sm font-medium text-slate-200">Your apply workflow</p>
    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <RouterLink to="/jobs" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-teal-300 hover:bg-slate-800">
        1. Find roles
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/approvals" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-teal-300 hover:bg-slate-800">
        2. My Queue
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 hover:bg-slate-800">
        3. Prepare &amp; apply
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/follow-ups" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-violet-300 hover:bg-slate-800">
        4. Follow-ups
      </RouterLink>
    </div>
    <p class="mt-3 text-xs text-slate-500">
      Fewer strong fits beat volume — check ATS match in My Queue before you submit, then use
      <RouterLink to="/follow-ups" class="text-violet-400 hover:underline">Follow-ups</RouterLink>
      for day-5 nudges.
    </p>
  </div>
</template>
