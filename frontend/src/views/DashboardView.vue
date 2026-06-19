<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await http.get('/analytics/summary');
    stats.value = data;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Dashboard</h2>
    <p class="mt-1 text-slate-400">Your remote job search at a glance</p>

    <div v-if="loading" class="mt-8 text-slate-400">Loading…</div>
    <div v-else-if="stats" class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="card p-5">
        <p class="text-sm text-slate-400">Total Jobs</p>
        <p class="mt-1 text-3xl font-bold text-teal-300">{{ stats.totalJobs }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400">Apply Today</p>
        <p class="mt-1 text-3xl font-bold text-amber-300">{{ stats.applyToday }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400">Submitted</p>
        <p class="mt-1 text-3xl font-bold text-teal-300">{{ stats.submitted }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400">High Match (80%+)</p>
        <p class="mt-1 text-3xl font-bold text-amber-300">{{ stats.highMatch }}</p>
      </div>
    </div>

    <div v-if="stats" class="mt-8 grid gap-6 lg:grid-cols-2">
      <div class="card p-6">
        <h3 class="font-semibold text-slate-200">Job Sections</h3>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex justify-between"><span class="text-slate-400">Apply Today</span><span class="badge badge-gold">{{ stats.applyToday }}</span></li>
          <li class="flex justify-between"><span class="text-slate-400">Strong Review</span><span class="badge badge-teal">{{ stats.strongReview }}</span></li>
          <li class="flex justify-between"><span class="text-slate-400">Manual Browse</span><span class="badge badge-slate">{{ stats.manualBrowse }}</span></li>
        </ul>
      </div>
      <div class="card p-6">
        <h3 class="font-semibold text-slate-200">Application Status</h3>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="(count, status) in stats.byStatus" :key="status" class="flex justify-between">
            <span class="text-slate-400">{{ status }}</span>
            <span class="badge badge-teal">{{ count }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-8 card p-6">
      <h3 class="font-semibold text-slate-200">Quick actions</h3>
      <div class="mt-4 flex flex-wrap gap-3">
        <RouterLink to="/jobs" class="btn-primary">Browse Jobs</RouterLink>
        <RouterLink to="/agent" class="btn-secondary">Run Agent</RouterLink>
        <RouterLink to="/generator" class="btn-secondary">Write Cover Letter</RouterLink>
      </div>
    </div>
  </div>
</template>
