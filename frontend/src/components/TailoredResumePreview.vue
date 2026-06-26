<script setup>
const props = defineProps({
  kit: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="py-6 text-center text-sm text-slate-500">Loading tailored resume…</div>

    <div v-else-if="!kit?.tailored" class="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
      Select a job below or apply with tailoring enabled to generate a preview.
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span
          class="rounded-full px-2 py-0.5 font-medium"
          :class="kit.useForApply !== false ? 'bg-teal-500/15 text-teal-300' : 'bg-slate-800 text-slate-400'"
        >
          {{ kit.useForApply !== false ? 'Will use on apply' : 'Saved · base resume on apply' }}
        </span>
        <span v-if="kit.pageCount" class="text-slate-500">
          {{ kit.pageCount }} page{{ kit.pageCount === 1 ? '' : 's' }}
        </span>
        <span v-if="kit.tailorMode === 'high_match'" class="text-violet-300">High match · JD word-alignment</span>
        <span v-if="kit.estimatedMatchPct" class="text-slate-500">~{{ kit.estimatedMatchPct }}% est. fit</span>
        <span v-if="kit.demo" class="text-amber-400">Demo mode</span>
      </div>

      <p v-if="kit.contactEmail" class="mt-3 text-xs text-teal-300/90">
        Submitted as {{ kit.contactName || 'You' }} · {{ kit.contactEmail }}
      </p>
      <p v-if="kit.generatedAt && !compact" class="mt-1 text-xs text-slate-600">Generated {{ formatDate(kit.generatedAt) }}</p>
      <p v-if="kit.tailorFocus" class="mt-2 text-xs text-slate-500">Focus: {{ kit.tailorFocus }}</p>

      <div v-if="kit.missingKeywords?.length" class="mt-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Keywords mirrored from job description</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span v-for="kw in kit.missingKeywords" :key="kw" class="badge badge-teal text-xs">{{ kw }}</span>
        </div>
      </div>

      <div v-if="kit.coverLetterParagraph" class="mt-5">
        <p class="text-sm font-medium text-slate-200">Cover letter</p>
        <div class="custom-scrollbar mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{{ kit.coverLetterParagraph }}</p>
        </div>
      </div>

      <div v-if="kit.supplementPages?.length" class="mt-5 space-y-4">
        <p class="text-sm font-medium text-slate-200">Tailored resume supplement</p>
        <p class="text-xs text-slate-500">Your base resume stays unchanged — this is added per job.</p>
        <div
          v-for="page in kit.supplementPages"
          :key="page.page"
          class="rounded-lg border border-slate-700/80 bg-slate-950/50 p-4"
        >
          <p class="text-xs font-medium uppercase text-slate-500">Page {{ page.page }} — {{ page.title }}</p>
          <pre class="custom-scrollbar mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{{ page.content }}</pre>
        </div>
      </div>

      <div v-else-if="kit.fullSupplementText" class="mt-5">
        <p class="text-sm font-medium text-slate-200">Full supplement</p>
        <pre class="custom-scrollbar mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/50 p-4 font-sans text-sm leading-relaxed text-slate-300">{{ kit.fullSupplementText }}</pre>
      </div>

      <div v-else-if="kit.formatted" class="mt-5">
        <p class="text-sm font-medium text-slate-200">Application kit</p>
        <pre class="custom-scrollbar mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/50 p-4 font-sans text-sm leading-relaxed text-slate-300">{{ kit.formatted }}</pre>
      </div>
    </template>
  </div>
</template>
