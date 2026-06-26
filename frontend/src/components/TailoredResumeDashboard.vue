<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import http from '../api/http';
import TailoredResumePreview from './TailoredResumePreview.vue';

const props = defineProps({
  refreshKey: { type: Number, default: 0 },
  showWhenBase: { type: Boolean, default: false },
});

const kits = ref([]);
const selectedJobId = ref('');
const kitDetail = ref(null);
const listLoading = ref(true);
const detailLoading = ref(false);
const error = ref('');

async function loadKits() {
  listLoading.value = true;
  error.value = '';
  try {
    const { data } = await http.get('/applications/kits');
    kits.value = Array.isArray(data) ? data : [];
    if (kits.value.length && !selectedJobId.value) {
      selectedJobId.value = kits.value[0].jobId;
    } else if (selectedJobId.value && !kits.value.find((k) => k.jobId === selectedJobId.value)) {
      selectedJobId.value = kits.value[0]?.jobId || '';
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load tailored resumes';
    kits.value = [];
    selectedJobId.value = '';
  } finally {
    listLoading.value = false;
  }
}

async function loadKitDetail(jobId) {
  if (!jobId) {
    kitDetail.value = null;
    return;
  }
  detailLoading.value = true;
  try {
    const { data } = await http.get(`/applications/kit/${encodeURIComponent(jobId)}`);
    kitDetail.value = data;
  } catch {
    kitDetail.value = null;
  } finally {
    detailLoading.value = false;
  }
}

watch(selectedJobId, (id) => {
  loadKitDetail(id);
});

watch(
  () => props.refreshKey,
  () => {
    loadKits().then(() => {
      if (selectedJobId.value) loadKitDetail(selectedJobId.value);
    });
  }
);

onMounted(async () => {
  await loadKits();
  if (selectedJobId.value) await loadKitDetail(selectedJobId.value);
});

defineExpose({ refresh: loadKits });
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold text-slate-100">Tailored resume preview</h3>
        <p class="mt-1 text-sm text-slate-500">Review the AI supplement before it goes out with your application.</p>
      </div>
      <button type="button" class="btn-secondary text-sm" :disabled="listLoading" @click="loadKits">
        {{ listLoading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>

    <div v-if="listLoading" class="mt-6 text-sm text-slate-500">Loading tailored resumes…</div>

    <div v-else-if="!kits.length" class="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
      <p class="text-sm text-slate-400">No tailored resumes yet.</p>
      <p class="mt-2 text-xs text-slate-500">
        Apply with <strong class="text-slate-400">Tailored resume</strong> selected — a per-job supplement will appear here for review.
      </p>
      <RouterLink to="/approvals" class="btn-secondary mt-4 inline-block text-sm">Review apply queue</RouterLink>
    </div>

    <template v-else>
      <div class="mt-5">
        <label class="mb-1 block text-sm text-slate-400">Preview for job</label>
        <select v-model="selectedJobId" class="input w-full text-sm sm:max-w-md">
          <option v-for="k in kits" :key="k.jobId" :value="k.jobId">
            {{ k.jobTitle }} · {{ k.company }}
            ({{ k.pageCount }}p{{ k.tailorMode === 'high_match' ? ' · high-match' : '' }})
          </option>
        </select>
      </div>

      <div class="mt-5 rounded-xl border border-violet-900/30 bg-violet-950/10 p-4">
        <TailoredResumePreview :kit="kitDetail" :loading="detailLoading" />
      </div>

      <p class="mt-4 text-xs text-slate-500">
        <RouterLink to="/tailored-resumes" class="text-teal-400 hover:underline">View all tailored resumes</RouterLink>
        ·
        <RouterLink to="/approvals" class="text-teal-400 hover:underline">Apply queue</RouterLink>
      </p>
    </template>
  </div>
</template>
