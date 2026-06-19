<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const tab = ref('market');
const loading = ref(false);
const error = ref('');

const pulse = ref(null);
const companyQuery = ref('');
const companyIntel = ref(null);
const salaryQuery = ref('');
const salaryReport = ref(null);
const scanCompany = ref('');
const scanResult = ref(null);
const voiceTranscript = ref('');
const voiceResult = ref(null);
const listening = ref(false);

async function loadPulse() {
  loading.value = true;
  try {
    const { data } = await http.get('/intelligence/market-pulse');
    pulse.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed';
  } finally {
    loading.value = false;
  }
}

async function fetchCompanyIntel() {
  if (!companyQuery.value) return;
  const { data } = await http.get(`/intelligence/company/${encodeURIComponent(companyQuery.value)}`);
  companyIntel.value = data;
}

async function fetchSalary() {
  if (!salaryQuery.value) return;
  const { data } = await http.post('/intelligence/salary', { query: salaryQuery.value });
  salaryReport.value = data;
}

async function runScan() {
  if (!scanCompany.value) return;
  const { data } = await http.get('/intelligence/scan', { params: { company: scanCompany.value } });
  scanResult.value = data;
}

async function runVoiceApply() {
  const { data } = await http.post('/intelligence/voice-apply', { transcript: voiceTranscript.value });
  voiceResult.value = data;
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    error.value = 'Speech recognition not supported in this browser';
    return;
  }
  const rec = new SR();
  rec.continuous = false;
  rec.interimResults = false;
  listening.value = true;
  rec.onresult = (e) => {
    voiceTranscript.value = e.results[0][0].transcript;
    listening.value = false;
    runVoiceApply();
  };
  rec.onerror = () => { listening.value = false; };
  rec.onend = () => { listening.value = false; };
  rec.start();
}

onMounted(loadPulse);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">AI Intelligence</h2>
    <p class="mt-1 text-slate-400">Match copilot, company intel, salary oracle, market pulse, voice apply & company scan</p>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="t in ['market', 'company', 'salary', 'scan', 'voice']"
        :key="t"
        class="rounded-xl px-4 py-2 text-sm capitalize transition"
        :class="tab === t ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:bg-slate-800/60'"
        @click="tab = t"
      >
        {{ t === 'market' ? 'Market Pulse' : t === 'scan' ? 'Company Scan' : t === 'voice' ? 'Voice Apply' : t }}
      </button>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-300">{{ error }}</p>

    <div v-if="tab === 'market'" class="mt-6 space-y-6">
      <div v-if="pulse" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-4"><p class="text-sm text-slate-400">Total jobs</p><p class="text-2xl font-bold text-teal-300">{{ pulse.totalJobs }}</p></div>
        <div class="card p-4"><p class="text-sm text-slate-400">Remote %</p><p class="text-2xl font-bold text-teal-300">{{ pulse.remotePercent }}%</p></div>
        <div class="card p-4"><p class="text-sm text-slate-400">Avg match</p><p class="text-2xl font-bold text-amber-300">{{ pulse.avgMatchPct }}%</p></div>
        <div class="card p-4"><p class="text-sm text-slate-400">Apply today</p><p class="text-2xl font-bold text-amber-300">{{ pulse.applyToday }}</p></div>
      </div>
      <div v-if="pulse" class="grid gap-6 lg:grid-cols-2">
        <div class="card p-6">
          <h3 class="font-semibold text-slate-200">Trending skills</h3>
          <ul class="mt-4 space-y-2">
            <li v-for="s in pulse.trendingSkills" :key="s.skill" class="flex justify-between text-sm">
              <span class="text-slate-300">{{ s.skill }}</span>
              <span class="badge" :class="s.trend === 'hot' ? 'badge-gold' : 'badge-teal'">{{ s.count }} · {{ s.trend }}</span>
            </li>
          </ul>
        </div>
        <div class="card p-6">
          <h3 class="font-semibold text-slate-200">Top hiring companies</h3>
          <ul class="mt-4 space-y-2 text-sm text-slate-400">
            <li v-for="c in pulse.topCompanies" :key="c.company" class="flex justify-between">
              <span>{{ c.company }}</span><span class="text-teal-400">{{ c.openings }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'company'" class="card mt-6 p-6">
      <input v-model="companyQuery" class="input" placeholder="Company name e.g. Stripe" @keyup.enter="fetchCompanyIntel" />
      <button class="btn-primary mt-3" @click="fetchCompanyIntel">Get intel</button>
      <pre v-if="companyIntel" class="mt-4 whitespace-pre-wrap text-sm text-slate-300">{{ companyIntel.intel }}</pre>
    </div>

    <div v-else-if="tab === 'salary'" class="card mt-6 p-6">
      <input v-model="salaryQuery" class="input" placeholder="e.g. Stripe SRE L4 remote" @keyup.enter="fetchSalary" />
      <button class="btn-primary mt-3" @click="fetchSalary">Oracle</button>
      <pre v-if="salaryReport" class="mt-4 whitespace-pre-wrap text-sm text-slate-300">{{ salaryReport.report }}</pre>
    </div>

    <div v-else-if="tab === 'scan'" class="card mt-6 p-6">
      <h3 class="font-semibold text-slate-200">Company Scan</h3>
      <p class="mt-1 text-sm text-slate-500">Point your search at any company — see open roles and match scores from your feed.</p>
      <input v-model="scanCompany" class="input mt-4" placeholder="Company name" @keyup.enter="runScan" />
      <button class="btn-primary mt-3" @click="runScan">Scan</button>
      <div v-if="scanResult" class="mt-4">
        <p class="text-teal-300">{{ scanResult.profileFit }}</p>
        <div v-for="job in scanResult.jobs" :key="job.jobId" class="mt-2 rounded-lg bg-slate-900/50 p-3 text-sm">
          <span class="text-slate-200">{{ job.title }}</span> · <span class="text-teal-400">{{ job.matchPct }}%</span>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'voice'" class="card mt-6 p-6">
      <h3 class="font-semibold text-slate-200">Voice Apply</h3>
      <p class="mt-1 text-sm text-slate-500">Say: "Apply to the top 3 DevOps roles" or "Queue Stripe jobs"</p>
      <textarea v-model="voiceTranscript" rows="3" class="input mt-4" placeholder="Or type your command…" />
      <div class="mt-3 flex gap-2">
        <button class="btn-primary" :disabled="listening" @click="startVoice">{{ listening ? 'Listening…' : '🎤 Speak' }}</button>
        <button class="btn-secondary" @click="runVoiceApply">Run command</button>
      </div>
      <pre v-if="voiceResult" class="mt-4 text-sm text-teal-300">{{ JSON.stringify(voiceResult, null, 2) }}</pre>
    </div>

    <p class="mt-8 text-sm text-slate-500">Match Copilot & Resume Diff: open any job in <RouterLink to="/jobs" class="text-teal-400">Jobs</RouterLink> and use the AI buttons.</p>
  </div>
</template>
