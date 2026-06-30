<script setup>
import { computed, onMounted, ref } from 'vue';
import http from '../api/http';
import FollowUpJobCard from '../components/FollowUpJobCard.vue';
import AtsKeywordScore from '../components/AtsKeywordScore.vue';

const loading = ref(true);
const board = ref(null);
const filter = ref('all');
const selectedId = ref('');
const copied = ref('');
const enriching = ref('');
const marking = ref('');

const jobs = computed(() => board.value?.jobs || []);
const filteredJobs = computed(() => {
  if (filter.value === 'due') return jobs.value.filter((j) => j.followUpDue);
  if (filter.value === 'upcoming') return jobs.value.filter((j) => j.followUpUpcoming);
  return jobs.value;
});

async function loadBoard() {
  loading.value = true;
  try {
    await http.post('/traction/scan');
    const { data } = await http.get('/traction/follow-up/board');
    board.value = data;
    if (!selectedId.value && data.jobs?.length) {
      const due = data.jobs.find((j) => j.followUpDue);
      selectedId.value = due?.jobId || data.jobs[0].jobId;
    }
  } finally {
    loading.value = false;
  }
}

function selectJob(job) {
  selectedId.value = selectedId.value === job.jobId ? '' : job.jobId;
}

async function copyText(value, label) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  copied.value = label;
  setTimeout(() => { copied.value = ''; }, 2000);
}

async function markDone(job) {
  marking.value = job.jobId;
  try {
    await http.post(`/traction/follow-up/${job.jobId}/done`, { notes: '' });
    job.followUpCompleted = true;
    job.followUpDue = false;
    await loadBoard();
  } finally {
    marking.value = '';
  }
}

async function enrichContacts(job) {
  enriching.value = job.jobId;
  try {
    const { data } = await http.post(`/traction/follow-up/${job.jobId}/enrich`);
    job.followUpKit = data;
    const row = board.value?.jobs?.find((j) => j.jobId === job.jobId);
    if (row) row.followUpKit = data;
  } finally {
    enriching.value = '';
  }
}

function openJob(job) {
  const url = job.url || job.followUpKit?.jobUrl;
  if (url) window.open(url, '_blank', 'noopener');
}

onMounted(loadBoard);
</script>

<template>
  <div class="follow-up-hub">
    <header class="follow-up-hero card p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-widest text-teal-400">Interview traction</p>
      <h2 class="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">Follow-up command center</h2>
      <p class="mt-2 max-w-2xl text-sm text-slate-400">
        Every application gets a tailored follow-up email, recruiter contacts, call script, and a day-5 reminder —
        so you reach hiring managers, not just the ATS black hole.
      </p>

      <div v-if="board" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="follow-up-stat">
          <p class="follow-up-stat__label">Applied</p>
          <p class="follow-up-stat__value">{{ board.summary?.total || 0 }}</p>
        </div>
        <div class="follow-up-stat follow-up-stat--due">
          <p class="follow-up-stat__label">Due now</p>
          <p class="follow-up-stat__value text-amber-300">{{ board.summary?.dueNow || 0 }}</p>
        </div>
        <div class="follow-up-stat">
          <p class="follow-up-stat__label">Reminder in 1–2 days</p>
          <p class="follow-up-stat__value text-teal-300">{{ board.summary?.upcoming || 0 }}</p>
        </div>
        <div class="follow-up-stat">
          <p class="follow-up-stat__label">Completed</p>
          <p class="follow-up-stat__value">{{ board.summary?.completed || 0 }}</p>
        </div>
      </div>

      <div v-if="board?.enrichment" class="mt-4 flex flex-wrap gap-2 text-xs">
        <span class="badge" :class="board.enrichment.hunterConfigured ? 'badge-teal' : 'badge-slate'">
          Hunter.io {{ board.enrichment.hunterConfigured ? 'connected' : 'not set' }}
        </span>
        <span class="badge" :class="board.enrichment.apolloConfigured ? 'badge-teal' : 'badge-slate'">
          Apollo {{ board.enrichment.apolloConfigured ? 'connected' : 'not set' }}
        </span>
        <span class="text-slate-500">Add HUNTER_API_KEY / APOLLO_API_KEY on Render for verified recruiter emails</span>
      </div>
    </header>

    <div class="mt-6 flex flex-wrap items-center gap-2">
      <button type="button" class="btn-secondary text-sm" :class="{ 'ring-1 ring-teal-500': filter === 'all' }" @click="filter = 'all'">All applied</button>
      <button type="button" class="btn-secondary text-sm" :class="{ 'ring-1 ring-amber-500': filter === 'due' }" @click="filter = 'due'">Due for follow-up</button>
      <button type="button" class="btn-secondary text-sm" :class="{ 'ring-1 ring-teal-500': filter === 'upcoming' }" @click="filter = 'upcoming'">Upcoming</button>
      <button type="button" class="btn-secondary ml-auto text-sm" :disabled="loading" @click="loadBoard">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading" class="mt-8 text-slate-400">Loading your applications…</div>
    <div v-else-if="!filteredJobs.length" class="card mt-6 p-10 text-center text-slate-500">
      <p v-if="filter === 'due'">No follow-ups due yet — they appear {{ board?.followUpDay || 5 }} days after you apply.</p>
      <p v-else-if="filter === 'upcoming'">Nothing scheduled in the next 2 days.</p>
      <p v-else>No submitted applications yet. Apply to a few strong matches, then return here for pre-drafted outreach.</p>
    </div>

    <div v-else class="mt-6 space-y-4">
      <FollowUpJobCard
        v-for="job in filteredJobs"
        :key="job.jobId"
        :job="job"
        :selected="selectedId === job.jobId"
        :copied="copied"
        @select="selectJob"
        @copy="copyText"
        @mark-done="markDone"
        @open-job="openJob"
        @enrich="enrichContacts"
      />

      <div v-if="selectedId && jobs.find((j) => j.jobId === selectedId)?.ats" class="card p-5">
        <AtsKeywordScore :job-id="selectedId" />
      </div>
    </div>

    <p class="mt-8 text-center text-xs text-slate-600">
      Tip: Regenerate tailored resumes with <strong class="text-slate-400">ATS high match</strong> in My Queue before submitting — aim for 85%+ green keywords.
    </p>
  </div>
</template>
