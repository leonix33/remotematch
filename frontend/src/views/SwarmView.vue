<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const runs = ref([]);
const running = ref(false);
const active = ref(null);

async function load() {
  const { data } = await http.get('/swarm');
  runs.value = data;
}

async function runSwarm() {
  running.value = true;
  active.value = null;
  try {
    const { data } = await http.post('/swarm/run');
    active.value = data;
    await load();
  } finally {
    running.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Multi-agent swarm</h2>
    <p class="mt-1 text-slate-400">Scout finds jobs → Writer drafts → Reviewer queues approvals — you stay in control</p>

    <button class="btn-primary mt-6" :disabled="running" @click="runSwarm">
      {{ running ? 'Swarm running…' : '▶ Launch swarm' }}
    </button>

    <div v-if="active" class="mt-8 grid gap-4 md:grid-cols-3">
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500">Scout</p>
        <p class="mt-2 text-sm text-teal-200">{{ active.stages?.scout?.status }}</p>
        <p class="mt-2 text-sm text-slate-400">{{ active.stages?.scout?.result }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500">Writer</p>
        <p class="mt-2 text-sm text-teal-200">{{ active.stages?.writer?.status }}</p>
        <p class="mt-2 whitespace-pre-wrap text-sm text-slate-400">{{ active.stages?.writer?.result }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500">Reviewer</p>
        <p class="mt-2 text-sm text-teal-200">{{ active.stages?.reviewer?.status }}</p>
        <p class="mt-2 text-sm text-slate-400">{{ active.stages?.reviewer?.result }}</p>
      </div>
    </div>
    <p v-if="active?.summary" class="mt-4 text-teal-300">{{ active.summary }}</p>

    <div v-if="runs.length" class="mt-10">
      <h3 class="font-semibold text-slate-200">Past runs</h3>
      <div class="mt-3 space-y-2">
        <div v-for="r in runs" :key="r._id" class="card p-3 text-sm text-slate-400">
          {{ new Date(r.createdAt).toLocaleString() }} — {{ r.status }} — {{ r.summary }}
        </div>
      </div>
    </div>
  </div>
</template>
