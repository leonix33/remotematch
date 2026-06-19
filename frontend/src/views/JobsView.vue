<script setup>
import { onMounted, ref, watch } from 'vue';
import http from '../api/http';

const jobs = ref([]);
const loading = ref(true);
const section = ref('all');
const minMatch = ref('0');
const search = ref('');

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get('/jobs', {
      params: { section: section.value, minMatch: minMatch.value, search: search.value },
    });
    jobs.value = data;
  } finally {
    loading.value = false;
  }
}

function sectionBadge(s) {
  if (s === 'apply_today') return 'badge-gold';
  if (s === 'strong_review') return 'badge-teal';
  return 'badge-slate';
}

function sectionLabel(s) {
  if (s === 'apply_today') return 'Apply Today';
  if (s === 'strong_review') return 'Strong Match';
  return 'Browse';
}

onMounted(load);
watch([section, minMatch], load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">Jobs</h2>
    <p class="mt-1 text-slate-400">Matched remote roles from your agent</p>

    <div class="mt-6 flex flex-wrap gap-3">
      <select v-model="section" class="input w-auto">
        <option value="all">All sections</option>
        <option value="apply_today">Apply Today</option>
        <option value="strong_review">Strong Match</option>
        <option value="manual_browse">Browse</option>
      </select>
      <select v-model="minMatch" class="input w-auto">
        <option value="0">Any match %</option>
        <option value="60">60%+</option>
        <option value="80">80%+</option>
      </select>
      <input v-model="search" class="input max-w-xs" placeholder="Search title, company…" @keyup.enter="load" />
      <button class="btn-secondary" @click="load">Search</button>
    </div>

    <div v-if="loading" class="mt-8 text-slate-400">Loading jobs…</div>
    <div v-else class="mt-6 space-y-3">
      <div v-for="job in jobs" :key="job.jobId || job._id" class="card p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-slate-100">{{ job.title }}</h3>
            <p class="text-sm text-slate-400">{{ job.company }} · {{ job.location || 'Remote' }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-teal">{{ job.matchPct || 0 }}% match</span>
            <span class="badge" :class="sectionBadge(job.emailSection)">{{ sectionLabel(job.emailSection) }}</span>
            <span v-if="job.atsType && job.atsType !== 'unknown'" class="badge badge-gold">{{ job.atsType }}</span>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-3 text-sm">
          <span class="text-slate-500">{{ job.source }}</span>
          <a v-if="job.url" :href="job.url" target="_blank" rel="noopener" class="text-teal-400 hover:underline">View job →</a>
        </div>
      </div>
      <p v-if="!jobs.length" class="text-slate-500">No jobs found. Run the agent to fetch new listings.</p>
    </div>
  </div>
</template>
