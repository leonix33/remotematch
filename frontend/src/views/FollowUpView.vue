<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';
import { useNotificationStore } from '../stores/notifications';
import JobScoreBadges from '../components/JobScoreBadges.vue';

const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(true);
const scanning = ref(false);
const trace = ref([]);
const summary = ref({ total: 0, high: 0, followUpsDue: 0, approveNow: 0 });
const digest = ref(null);
const digestLoading = ref(false);
const digestSending = ref(false);
const digestMsg = ref('');
const digestError = ref('');
const markingId = ref('');

const typeLabels = {
  follow_up: 'Follow up',
  approve_now: 'Approve now',
  apply_now: 'Apply now',
  manual_action: 'Manual action',
};

const urgencyClass = {
  high: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  medium: 'text-teal-300 border-teal-500/40 bg-teal-500/10',
  low: 'text-slate-400 border-slate-700 bg-slate-900/40',
};

const filteredTrace = computed(() => trace.value);

async function loadTrace() {
  loading.value = true;
  try {
    const { data } = await http.get('/traction/trace');
    trace.value = data.trace || [];
    summary.value = data.summary || {};
  } finally {
    loading.value = false;
  }
}

async function loadDigestPreview() {
  digestLoading.value = true;
  digestError.value = '';
  try {
    const { data } = await http.get('/traction/digest/preview');
    digest.value = data;
  } catch (e) {
    digestError.value = e.response?.data?.message || 'Could not load digest preview';
  } finally {
    digestLoading.value = false;
  }
}

async function scanNotifications() {
  scanning.value = true;
  try {
    await http.post('/traction/scan');
    await notificationStore.fetch();
  } finally {
    scanning.value = false;
  }
}

async function sendDigest() {
  digestMsg.value = '';
  digestError.value = '';
  digestSending.value = true;
  try {
    const { data } = await http.post('/traction/digest/send');
    if (data?.sent === false) {
      digestError.value = data.reason || 'Email not sent';
    } else {
      digestMsg.value = `Digest sent to ${digest.value?.digestEmail || 'your email'}.`;
    }
  } catch (e) {
    digestError.value = e.response?.data?.message || 'Could not send digest';
  } finally {
    digestSending.value = false;
  }
}

async function markDone(item) {
  markingId.value = item.jobId;
  try {
    await http.post(`/traction/follow-up/${item.jobId}/done`, { notes: '' });
    trace.value = trace.value.filter((t) => t.jobId !== item.jobId || t.type !== 'follow_up');
    summary.value.followUpsDue = trace.value.filter((t) => t.type === 'follow_up').length;
    summary.value.total = trace.value.length;
  } finally {
    markingId.value = '';
  }
}

function openLink(item) {
  if (item.url) window.open(item.url, '_blank', 'noopener');
  else if (item.link) router.push(item.link);
}

onMounted(async () => {
  await Promise.all([loadTrace(), loadDigestPreview(), scanNotifications()]);
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Traction trace</h2>
    <p class="mt-1 text-slate-400">
      Best jobs to follow up, approve, or finish — ranked by interview likelihood and urgency
    </p>

    <div v-if="!loading" class="mobile-queue-stats mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">Actions</p>
        <p class="text-2xl font-bold text-slate-200">{{ summary.total }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">High priority</p>
        <p class="text-2xl font-bold text-amber-300">{{ summary.high }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">Follow-ups due</p>
        <p class="text-2xl font-bold text-teal-300">{{ summary.followUpsDue }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">Approve now</p>
        <p class="text-2xl font-bold text-slate-200">{{ summary.approveNow }}</p>
      </div>
    </div>

    <div class="card mt-8 p-4 sm:p-6">
      <div class="mobile-stack-filters flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-slate-200">Email digest</h3>
          <p class="mt-1 text-sm text-slate-500">
            Preview what goes to your personal email — best-fit jobs you have applied to, plus follow-ups.
          </p>
          <p v-if="digest?.digestEmail" class="mt-2 text-sm text-teal-300">
            Sends to: {{ digest.digestEmail }}
          </p>
          <p v-else class="mt-2 text-sm text-amber-300">
            Add your email in Profile → Email & follow-ups
          </p>
          <p v-if="digest && digest.emailConfigured === false" class="mt-2 text-sm text-amber-300">
            Email delivery is not configured — ask your admin to add GMAIL_SMTP_USER/PASS or RESEND_API_KEY on Render.
          </p>
        </div>
        <div class="mobile-job-actions flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <button type="button" class="btn-secondary text-sm" :disabled="digestLoading" @click="loadDigestPreview">
            {{ digestLoading ? 'Refreshing…' : 'Refresh preview' }}
          </button>
          <button
            type="button"
            class="btn-primary text-sm"
            :disabled="digestSending || !digest?.emailDigestEnabled || !digest?.digestEmail"
            @click="sendDigest"
          >
            {{ digestSending ? 'Sending…' : 'Send digest now' }}
          </button>
        </div>
      </div>

      <p v-if="digestMsg" class="mt-3 text-sm text-teal-300">{{ digestMsg }}</p>
      <p v-if="digestError" class="mt-3 text-sm text-red-300">{{ digestError }}</p>

      <div v-if="digestLoading" class="mt-4 text-slate-500">Loading preview…</div>
      <div v-else-if="digest" class="mt-6 space-y-6">
        <div>
          <h4 class="text-sm font-medium text-slate-300">Applied — best fit first</h4>
          <div v-if="!digest.applied?.length" class="mt-2 text-sm text-slate-500">No submitted applications yet.</div>
          <div v-else class="mt-2">
            <div class="mobile-applied-cards md:hidden">
              <div v-for="j in digest.applied.slice(0, 10)" :key="`card-${j.jobId}`" class="mobile-applied-card">
                <p class="font-medium text-slate-200">{{ j.title }}</p>
                <p class="mt-0.5 text-sm text-slate-400">{{ j.company }}</p>
                <div class="mt-2">
                  <JobScoreBadges :job="j" />
                </div>
                <p class="mt-2 text-xs text-slate-500">{{ j.source }}</p>
              </div>
            </div>
            <div class="mobile-table-wrap hidden overflow-x-auto md:block">
            <table class="w-full text-left text-sm">
              <thead class="text-slate-500">
                <tr>
                  <th class="pb-2 pr-4">Role</th>
                  <th class="pb-2 pr-4">Company</th>
                  <th class="pb-2 pr-4">Scores</th>
                  <th class="pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="j in digest.applied.slice(0, 10)" :key="j.jobId" class="border-t border-slate-800/80">
                  <td class="py-2 pr-4 text-slate-200">{{ j.title }}</td>
                  <td class="py-2 pr-4 text-slate-400">{{ j.company }}</td>
                  <td class="py-2 pr-4">
                    <JobScoreBadges :job="j" />
                  </td>
                  <td class="py-2 text-slate-500">{{ j.source }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
        <div v-if="digest.followUps?.length">
          <h4 class="text-sm font-medium text-slate-300">Follow-ups in digest</h4>
          <ul class="mt-2 space-y-1 text-sm text-slate-400">
            <li v-for="f in digest.followUps.slice(0, 5)" :key="f.id">• {{ f.title }} @ {{ f.company }} — {{ f.reason }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
      <h3 class="font-semibold text-slate-200">Action queue</h3>
      <button type="button" class="btn-secondary w-full text-sm sm:w-auto" :disabled="scanning" @click="scanNotifications">
        {{ scanning ? 'Scanning…' : 'Refresh notifications' }}
      </button>
    </div>

    <div v-if="loading" class="mt-4 text-slate-400">Loading traction trace…</div>
    <div v-else-if="!filteredTrace.length" class="card mt-4 p-8 text-center text-slate-500">
      Nothing urgent right now. Approve high-likelihood jobs or check back after applications age 3+ days.
    </div>
    <div v-else class="mt-4 space-y-3">
      <article
        v-for="item in filteredTrace"
        :key="item.id"
        class="card p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
                :class="urgencyClass[item.urgency] || urgencyClass.low"
              >
                {{ typeLabels[item.type] || item.type }}
              </span>
              <span class="text-xs text-slate-500">Traction {{ item.tractionScore }}</span>
            </div>
            <h4 class="mt-2 font-medium text-slate-100">{{ item.title }}</h4>
            <p class="text-sm text-slate-400">{{ item.company }}</p>
            <div class="mt-2">
              <JobScoreBadges :job="item" />
            </div>
            <p class="mt-2 text-sm text-slate-400">{{ item.reason }}</p>
            <p class="mt-1 text-sm text-teal-400/90">{{ item.suggestedAction }}</p>
            <p v-if="item.daysSinceApply != null" class="mt-1 text-xs text-slate-600">
              {{ item.daysSinceApply }} day(s) since apply
            </p>
          </div>
          <div class="mobile-job-actions mt-3 flex w-full shrink-0 flex-col gap-2 sm:mt-0 sm:w-auto">
            <button type="button" class="btn-primary text-sm" @click="openLink(item)">
              {{ item.url ? 'Open job' : 'Go to queue' }}
            </button>
            <button
              v-if="item.type === 'follow_up'"
              type="button"
              class="btn-secondary text-sm"
              :disabled="markingId === item.jobId"
              @click="markDone(item)"
            >
              {{ markingId === item.jobId ? 'Saving…' : 'Mark followed up' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
