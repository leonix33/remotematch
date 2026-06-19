<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const running = ref(false);
const output = ref('');
const error = ref('');
const runs = ref([]);

async function loadRuns() {
  try {
    const { data } = await http.get('/agent/runs');
    runs.value = data;
  } catch {
    runs.value = [];
  }
}

async function runAgent() {
  error.value = '';
  output.value = '';
  running.value = true;
  try {
    const { data } = await http.post('/agent/run');
    output.value = data.output || data.message;
    await loadRuns();
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Agent run failed';
  } finally {
    running.value = false;
  }
}

onMounted(loadRuns);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">Run Agent</h2>
    <p class="mt-1 text-slate-400">Search for new jobs — approve matches, then apply only what you approved</p>

    <div class="mt-8 card p-6">
      <p class="text-sm text-slate-400">
        <strong class="text-teal-300">Search only</strong> — runs your Python agent to fetch and score jobs.
        Auto-apply is <em>disabled</em> until you approve roles in the Apply Queue and click Apply Approved.
      </p>
      <button class="btn-primary mt-6" :disabled="running" @click="runAgent">
        {{ running ? 'Searching…' : '▶ Run job search' }}
      </button>
      <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>
      <pre v-if="output" class="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-400">{{ output }}</pre>
    </div>

    <div v-if="runs.length" class="mt-8 card p-6">
      <h3 class="font-semibold text-slate-200">Recent runs</h3>
      <ul class="mt-4 space-y-2 text-sm">
        <li v-for="run in runs" :key="run._id" class="flex justify-between text-slate-400">
          <span>{{ new Date(run.createdAt).toLocaleString() }}</span>
          <span class="badge" :class="run.status === 'completed' ? 'badge-teal' : 'badge-red'">{{ run.status }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
