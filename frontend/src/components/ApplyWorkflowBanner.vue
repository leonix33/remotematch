<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="rounded-xl border border-teal-900/40 bg-slate-900/50 p-4">
    <p class="text-sm font-medium text-slate-200">Your apply workflow</p>
    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <RouterLink to="/jobs" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-teal-300 hover:bg-slate-800">
        1. Find jobs
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/jobs" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 hover:bg-slate-800">
        2. Save
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/approvals" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-teal-300 hover:bg-slate-800">
        3. Apply queue
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/applications" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 hover:bg-slate-800">
        4. Track status
      </RouterLink>
      <span class="text-slate-600">→</span>
      <RouterLink to="/calendar" class="rounded-lg bg-slate-800/80 px-2.5 py-1.5 hover:bg-slate-800">
        5. Follow up
      </RouterLink>
    </div>
  </div>
</template>
