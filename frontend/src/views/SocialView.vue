<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const tab = ref('pods');
const pods = ref([]);
const watchlist = ref([]);
const referrals = ref([]);
const victories = ref([]);
const contacts = ref([]);
const insights = ref(null);

const podForm = ref({ name: '', memberIds: [], weeklyGoal: 5 });
const watchCompany = ref('');
const refForm = ref({ company: '', title: '', body: '' });
const victoryForm = ref({ company: '', title: '', message: '', type: 'onsite' });

async function load() {
  const [podsRes, watchRes, refRes, vicRes, contactRes, insightRes] = await Promise.all([
    http.get('/social/pods').catch(() => ({ data: [] })),
    http.get('/social/watchlist').catch(() => ({ data: [] })),
    http.get('/social/referrals').catch(() => ({ data: [] })),
    http.get('/social/victories').catch(() => ({ data: [] })),
    http.get('/chat/contacts').catch(() => ({ data: [] })),
    http.get('/outcomes/insights').catch(() => ({ data: null })),
  ]);
  pods.value = podsRes.data;
  watchlist.value = watchRes.data;
  referrals.value = refRes.data;
  victories.value = vicRes.data;
  contacts.value = contactRes.data;
  insights.value = insightRes.data;
}

async function createPod() {
  await http.post('/social/pods', podForm.value);
  podForm.value = { name: '', memberIds: [], weeklyGoal: 5 };
  await load();
}

async function addWatch() {
  await http.post('/social/watchlist', { company: watchCompany.value });
  watchCompany.value = '';
  await load();
}

async function removeWatch(id) {
  await http.delete(`/social/watchlist/${id}`);
  await load();
}

async function createReferral() {
  await http.post('/social/referrals', refForm.value);
  refForm.value = { company: '', title: '', body: '' };
  await load();
}

async function postVictory() {
  await http.post('/social/victories', victoryForm.value);
  victoryForm.value = { company: '', title: '', message: '', type: 'onsite' };
  await load();
}

function toggleMember(id) {
  const i = podForm.value.memberIds.indexOf(id);
  if (i >= 0) podForm.value.memberIds.splice(i, 1);
  else podForm.value.memberIds.push(id);
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Social & outcomes</h2>
    <p class="mt-1 text-slate-400">Accountability pods, watchlists, referrals, victory feed, outcome learning</p>

    <div v-if="insights" class="mt-6 card p-4">
      <p class="text-sm text-slate-400">Outcome learning · {{ insights.stats?.total }} tracked · {{ insights.conversionRate }}% offer rate</p>
      <pre class="mt-2 whitespace-pre-wrap text-sm text-teal-200">{{ insights.aiInsight }}</pre>
    </div>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="t in ['pods', 'watchlist', 'referrals', 'victories']"
        :key="t"
        class="rounded-xl px-4 py-2 text-sm capitalize transition"
        :class="tab === t ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:bg-slate-800/60'"
        @click="tab = t"
      >
        {{ t === 'pods' ? 'Accountability Pods' : t }}
      </button>
    </div>

    <div v-if="tab === 'pods'" class="mt-6 grid gap-6 lg:grid-cols-2">
      <form class="card p-6" @submit.prevent="createPod">
        <h3 class="font-semibold text-slate-200">Create pod</h3>
        <input v-model="podForm.name" class="input mt-4" placeholder="Pod name" required />
        <p class="mt-3 text-sm text-slate-500">Members:</p>
        <label v-for="c in contacts" :key="c.id" class="mt-1 flex gap-2 text-sm">
          <input type="checkbox" :checked="podForm.memberIds.includes(c.id)" @change="toggleMember(c.id)" />
          {{ c.name }}
        </label>
        <button type="submit" class="btn-primary mt-4">Create pod</button>
      </form>
      <div class="space-y-3">
        <div v-for="p in pods" :key="p._id" class="card p-4">
          <p class="font-medium text-slate-200">{{ p.name }}</p>
          <p class="text-sm text-slate-500">{{ p.members?.length }} members · goal {{ p.members?.[0]?.weeklyGoal }}/week</p>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'watchlist'" class="mt-6">
      <form class="flex gap-2" @submit.prevent="addWatch">
        <input v-model="watchCompany" class="input max-w-xs" placeholder="Company to watch" required />
        <button class="btn-primary">Add</button>
      </form>
      <div class="mt-4 space-y-2">
        <div v-for="w in watchlist" :key="w._id" class="card flex items-center justify-between p-4">
          <div>
            <p class="font-medium text-slate-200">{{ w.company }}</p>
            <p class="text-sm text-slate-500">{{ w.jobCount }} roles · {{ w.topRole || 'No roles' }}</p>
          </div>
          <button class="btn-secondary text-xs" @click="removeWatch(w._id)">Remove</button>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'referrals'" class="mt-6 grid gap-6 lg:grid-cols-2">
      <form class="card p-6" @submit.prevent="createReferral">
        <h3 class="font-semibold text-slate-200">Ask for referral</h3>
        <input v-model="refForm.company" class="input mt-4" placeholder="Company" required />
        <input v-model="refForm.title" class="input mt-2" placeholder="Title e.g. Anyone at Datadog?" required />
        <textarea v-model="refForm.body" class="input mt-2" rows="3" placeholder="Details" />
        <button type="submit" class="btn-primary mt-3">Post</button>
      </form>
      <div class="space-y-3">
        <div v-for="r in referrals" :key="r._id" class="card p-4">
          <p class="font-medium text-slate-200">{{ r.title }}</p>
          <p class="text-sm text-slate-500">{{ r.company }} · {{ r.replies?.length || 0 }} replies</p>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'victories'" class="mt-6 grid gap-6 lg:grid-cols-2">
      <form class="card p-6" @submit.prevent="postVictory">
        <h3 class="font-semibold text-slate-200">Share a win</h3>
        <input v-model="victoryForm.company" class="input mt-4" placeholder="Company" required />
        <select v-model="victoryForm.type" class="input mt-2">
          <option value="onsite">Onsite</option>
          <option value="offer">Offer</option>
          <option value="interview">Interview</option>
          <option value="applied">Applied</option>
        </select>
        <textarea v-model="victoryForm.message" class="input mt-2" rows="3" placeholder="Your story" />
        <button type="submit" class="btn-primary mt-3">Post victory</button>
      </form>
      <div class="space-y-3">
        <div v-for="v in victories" :key="v._id" class="card p-4">
          <p class="font-medium text-teal-200">{{ v.userName }} · {{ v.type }} @ {{ v.company }}</p>
          <p class="mt-1 text-sm text-slate-400">{{ v.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
