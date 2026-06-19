<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const conferences = ref([]);
const format = ref('');
const weekOnly = ref(true);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get('/conferences', {
      params: { format: format.value || undefined, week: weekOnly.value ? 'true' : 'false' },
    });
    conferences.value = data;
  } finally {
    loading.value = false;
  }
}

function formatBadge(f) {
  if (f === 'remote') return 'badge-teal';
  if (f === 'in_person') return 'badge-gold';
  return 'badge-slate';
}

function formatLabel(f) {
  if (f === 'remote') return 'Remote';
  if (f === 'in_person') return 'In person';
  return 'Hybrid';
}

function dateRange(c) {
  const start = new Date(c.startDate);
  const end = c.endDate ? new Date(c.endDate) : null;
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  if (c.recurring === 'weekly') return `Every week · ${start.toLocaleDateString(undefined, { weekday: 'long' })}`;
  if (end && end.toDateString() !== start.toDateString()) {
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  }
  return start.toLocaleDateString(undefined, { ...opts, hour: '2-digit', minute: '2-digit' });
}

function locationLine(c) {
  if (c.format === 'remote') return c.location || 'Online';
  return [c.city, c.state].filter(Boolean).join(', ') || c.location;
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Job conferences</h2>
    <p class="mt-1 text-slate-400">Weekly virtual meetups and US in-person events for engineers and job seekers</p>

    <div class="mt-6 flex flex-wrap gap-3">
      <select v-model="format" class="input w-auto" @change="load">
        <option value="">All formats</option>
        <option value="remote">Remote only</option>
        <option value="in_person">In person</option>
        <option value="hybrid">Hybrid</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-slate-400">
        <input v-model="weekOnly" type="checkbox" @change="load" /> This week only
      </label>
      <button class="btn-secondary" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="mt-8 text-slate-400">Loading conferences…</div>
    <div v-else class="mt-6 space-y-4">
      <div v-for="c in conferences" :key="c._id || c.id" class="card p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-semibold text-slate-100">{{ c.name }}</h3>
              <span v-if="c.featured" class="badge badge-gold">Featured</span>
              <span v-if="c.recurring === 'weekly'" class="badge badge-teal">Weekly</span>
            </div>
            <p class="mt-1 text-sm text-slate-400">{{ c.description }}</p>
          </div>
          <span class="badge" :class="formatBadge(c.format)">{{ formatLabel(c.format) }}</span>
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>📅 {{ dateRange(c) }}</span>
          <span>📍 {{ locationLine(c) }}</span>
        </div>
        <div v-if="c.tags?.length" class="mt-3 flex flex-wrap gap-2">
          <span v-for="tag in c.tags" :key="tag" class="badge badge-slate text-xs">{{ tag }}</span>
        </div>
        <a v-if="c.url" :href="c.url" target="_blank" rel="noopener" class="mt-4 inline-block text-sm text-teal-400 hover:underline">
          View details →
        </a>
      </div>
      <p v-if="!conferences.length" class="text-slate-500">No conferences match your filters.</p>
    </div>
  </div>
</template>
