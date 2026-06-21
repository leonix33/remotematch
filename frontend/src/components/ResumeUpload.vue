<script setup>
import { ref } from 'vue';
import { useProfileStore } from '../stores/profile';

const props = defineProps({
  modelValue: { type: String, default: '' },
  showPreview: { type: Boolean, default: true },
  applyToProfile: { type: Boolean, default: false },
  mergeSkills: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'parsed', 'error']);

const profileStore = useProfileStore();
const parsing = ref(false);
const fileName = ref('');
const parseSummary = ref(null);
const localError = ref('');

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  localError.value = '';
  parseSummary.value = null;
  parsing.value = true;
  fileName.value = file.name;

  try {
    const fileBase64 = await fileToBase64(file);
    const result = await profileStore.parseResume({
      fileBase64,
      filename: file.name,
      applyToProfile: props.applyToProfile,
      mergeSkills: props.mergeSkills,
    });

    emit('update:modelValue', result.resumeText);
    parseSummary.value = {
      skills: result.extractedSkills?.all?.length || 0,
      words: result.wordCount || 0,
      score: result.resumeScore ?? profileStore.resumeScore,
      mustHave: result.extractedSkills?.mustHave || [],
      niceToHave: result.extractedSkills?.niceToHave || [],
      suggestedHeadline: result.suggestedHeadline || '',
      suggestedTitles: result.suggestedTitles || [],
    };
    emit('parsed', result);
  } catch (e) {
    localError.value = e.response?.data?.message || e.message || 'Could not parse resume';
    emit('error', localError.value);
  } finally {
    parsing.value = false;
    event.target.value = '';
  }
}
</script>

<template>
  <div class="space-y-3">
    <label
      class="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/40 px-4 py-6 transition hover:border-teal-600/50 hover:bg-slate-800/60"
      :class="parsing ? 'pointer-events-none opacity-70' : ''"
    >
      <span class="text-2xl">{{ parsing ? '⏳' : '📄' }}</span>
      <span class="mt-2 text-sm font-medium text-slate-300">
        {{ parsing ? 'Parsing resume…' : fileName || 'Upload resume (PDF, .txt, .md)' }}
      </span>
      <span class="mt-1 text-xs text-slate-500">We extract skills and improve your match score</span>
      <input
        type="file"
        accept=".pdf,.txt,.md,.text,application/pdf"
        class="hidden"
        :disabled="parsing"
        @change="handleFile"
      />
    </label>

    <p v-if="localError" class="text-sm text-red-300">{{ localError }}</p>

    <div
      v-if="showPreview && parseSummary"
      class="rounded-xl border border-teal-900/40 bg-teal-950/20 p-4 text-sm"
    >
      <p class="font-medium text-teal-200">
        Resume parsed — {{ parseSummary.skills }} skills found · score {{ parseSummary.score }}
      </p>
      <p class="mt-1 text-slate-400">{{ parseSummary.words }} words extracted</p>
      <div v-if="parseSummary.mustHave.length" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="skill in parseSummary.mustHave.slice(0, 8)"
          :key="skill"
          class="badge badge-teal"
        >
          {{ skill }}
        </span>
        <span v-if="parseSummary.mustHave.length > 8" class="text-xs text-slate-500">
          +{{ parseSummary.mustHave.length - 8 }} more
        </span>
      </div>
    </div>
  </div>
</template>
