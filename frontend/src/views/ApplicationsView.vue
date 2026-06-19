<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const apps = ref([]);
const loading = ref(true);
const statusFilter = ref('');

async function load() {
  loading.value = true;
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {};
    const { data } = await http.get('/applications', { params });
    apps.value = data;
  } finally {
    loading.value = false;
  }
}

function statusClass(s) {
  if (s === 'submitted') return 'badge-teal';
  if (s === 'bot-blocked') return 'badge-red';
  return 'badge-slate';
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">Applications</h2>
    <p class="mt-1 text-slate-400">Track auto-apply and manual review status</p>

    <div class="mt-6">
      <select v-model="statusFilter" class="input w-auto" @change="load">
        <option value="">All statuses</option>
        <option value="submitted">Submitted</option>
        <option value="bot-blocked">Bot blocked</option>
        <option value="manual-review">Manual review</option>
        <option value="email-apply">Email apply</option>
        <option value="external-apply">External apply</option>
      </select>
    </div>

    <div v-if="loading" class="mt-8 text-slate-400">Loading…</div>
    <div v-else class="mt-6 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-slate-700 text-slate-400">
            <th class="py-3 pr-4">Title</th>
            <th class="py-3 pr-4">Status</th>
            <th class="py-3 pr-4">Attempts</th>
            <th class="py-3">Last tried</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in apps" :key="app.jobId || app._id" class="border-b border-slate-800">
            <td class="py-3 pr-4">
              <p class="font-medium text-slate-200">{{ app.title }}</p>
              <a v-if="app.applyUrl || app.jobUrl" :href="app.applyUrl || app.jobUrl" target="_blank" class="text-xs text-teal-400 hover:underline">Open →</a>
            </td>
            <td class="py-3 pr-4"><span class="badge" :class="statusClass(app.status)">{{ app.status }}</span></td>
            <td class="py-3 pr-4 text-slate-400">{{ app.attempts || 0 }}</td>
            <td class="py-3 text-slate-500">{{ app.lastAttempted || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!apps.length" class="mt-4 text-slate-500">No applications yet.</p>
    </div>
  </div>
</template>
