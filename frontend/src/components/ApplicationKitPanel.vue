<script setup>
import { ref, watch } from 'vue';
import http from '../api/http';

const props = defineProps({
  job: { type: Object, required: true },
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const loading = ref(false);
const generating = ref(false);
const error = ref('');
const kit = ref(null);
const tailor = ref(true);

async function loadKit() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await http.get(`/applications/kit/${encodeURIComponent(props.job.jobId)}`);
    kit.value = data;
  } catch {
    kit.value = null;
  } finally {
    loading.value = false;
  }
}

async function generate() {
  generating.value = true;
  error.value = '';
  try {
    const { data } = await http.post(`/applications/kit/${encodeURIComponent(props.job.jobId)}/generate`, {
      tailorResume: tailor.value,
      force: true,
    });
    kit.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not generate application kit';
  } finally {
    generating.value = false;
  }
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      kit.value = null;
      loadKit();
    }
  }
);
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
    <div class="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
      <h3 class="font-semibold text-slate-100">Application kit — {{ job.title }}</h3>
      <p class="mt-1 text-sm text-slate-400">{{ job.company }}</p>
      <p class="mt-3 rounded-lg border border-teal-900/40 bg-teal-950/20 px-3 py-2 text-xs text-teal-100/90">
        Your base resume is never rewritten. We only suggest <strong class="text-teal-200">additive</strong> bullets,
        keywords, and a cover paragraph you can paste into the ATS.
      </p>

      <label class="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input v-model="tailor" type="checkbox" class="accent-teal-500" />
        Tailor resume for this job (additive only)
      </label>

      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn-primary text-sm" :disabled="generating" @click="generate">
          {{ generating ? 'Generating…' : kit?.tailored ? 'Regenerate kit' : 'Generate kit' }}
        </button>
        <button v-if="kit?.coverLetterParagraph" class="btn-secondary text-sm" @click="copyText(kit.coverLetterParagraph)">
          Copy cover paragraph
        </button>
        <button v-if="kit?.formatted" class="btn-secondary text-sm" @click="copyText(kit.formatted)">
          Copy full kit
        </button>
        <button class="btn-secondary text-sm" @click="emit('close')">Close</button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-300">{{ error }}</p>
      <p v-if="loading" class="mt-4 text-sm text-slate-400">Loading…</p>

      <div v-else-if="kit && !kit.tailored" class="mt-4 text-sm text-slate-400">
        {{ kit.message || 'Tailoring is off. Enable the checkbox above and generate.' }}
      </div>

      <div v-else-if="kit" class="mt-5 space-y-5 text-sm">
        <p v-if="kit.demo" class="text-xs text-amber-300">Demo mode — set OPENAI_API_KEY for live AI tailoring.</p>
        <p class="text-xs text-slate-500">{{ kit.guardrails }}</p>

        <div v-if="kit.missingKeywords?.length">
          <h4 class="font-medium text-slate-200">Keywords to mirror (if accurate)</h4>
          <p class="mt-1 text-slate-400">{{ kit.missingKeywords.join(' · ') }}</p>
        </div>

        <div v-if="kit.skillsToHighlight?.length">
          <h4 class="font-medium text-slate-200">Skills to emphasize</h4>
          <p class="mt-1 text-slate-400">{{ kit.skillsToHighlight.join(' · ') }}</p>
        </div>

        <div v-if="kit.additiveBullets?.length">
          <h4 class="font-medium text-slate-200">Additive bullets (add only if truthful)</h4>
          <ul class="mt-2 space-y-2 text-slate-300">
            <li v-for="(b, i) in kit.additiveBullets" :key="i">
              <span class="text-xs text-slate-500">[{{ b.section }}]</span> {{ b.text }}
            </li>
          </ul>
        </div>

        <div v-if="kit.resumeAddendum">
          <h4 class="font-medium text-slate-200">Resume addendum</h4>
          <p class="mt-1 whitespace-pre-wrap text-slate-300">{{ kit.resumeAddendum }}</p>
        </div>

        <div v-if="kit.coverLetterParagraph">
          <h4 class="font-medium text-slate-200">Cover letter paragraph</h4>
          <p class="mt-1 whitespace-pre-wrap text-slate-300">{{ kit.coverLetterParagraph }}</p>
        </div>

        <div v-if="kit.atsTips?.length">
          <h4 class="font-medium text-slate-200">ATS tips</h4>
          <ul class="mt-1 list-disc pl-5 text-slate-400">
            <li v-for="(tip, i) in kit.atsTips" :key="i">{{ tip }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
