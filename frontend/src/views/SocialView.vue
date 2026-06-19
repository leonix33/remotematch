<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const tab = ref('pods');
const pods = ref([]);
const watchlist = ref([]);
const referrals = ref([]);
const introOffers = ref([]);
const victories = ref([]);
const contacts = ref([]);
const insights = ref(null);

const podForm = ref({ name: '', memberIds: [], weeklyGoal: 5 });
const watchCompany = ref('');
const watchShared = ref(false);
const refForm = ref({ company: '', title: '', body: '' });
const victoryForm = ref({ company: '', title: '', message: '', type: 'onsite' });
const introMessage = ref('');
const offerThreadId = ref(null);

async function load() {
  const [podsRes, watchRes, refRes, introRes, vicRes, contactRes, insightRes] = await Promise.all([
    http.get('/social/pods').catch(() => ({ data: [] })),
    http.get('/social/watchlist').catch(() => ({ data: [] })),
    http.get('/social/referrals').catch(() => ({ data: [] })),
    http.get('/social/intro-offers').catch(() => ({ data: [] })),
    http.get('/social/victories').catch(() => ({ data: [] })),
    http.get('/chat/contacts').catch(() => ({ data: [] })),
    http.get('/outcomes/insights').catch(() => ({ data: null })),
  ]);
  pods.value = podsRes.data;
  watchlist.value = watchRes.data;
  referrals.value = refRes.data;
  introOffers.value = introRes.data;
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
  await http.post('/social/watchlist', { company: watchCompany.value, shared: watchShared.value });
  watchCompany.value = '';
  watchShared.value = false;
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

async function offerIntro(threadId) {
  await http.post(`/social/referrals/${threadId}/offer-intro`, { message: introMessage.value });
  introMessage.value = '';
  offerThreadId.value = null;
  await load();
}

async function acceptIntro(id) {
  const { data } = await http.post(`/social/intro-offers/${id}/accept`);
  if (data.conversationId) window.location.href = `/chat?c=${data.conversationId}`;
  await load();
}

async function declineIntro(id) {
  await http.post(`/social/intro-offers/${id}/decline`);
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

function isThreadOwner(thread) {
  return thread.createdBy?.toString() === auth.user?.id;
}

onMounted(load);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Social & outcomes</h2>
    <p class="mt-1 text-slate-400">Pods, shared watchlists, referral marketplace, victory feed</p>

    <div v-if="insights" class="mt-6 card p-4">
      <p class="text-sm text-slate-400">Outcome learning · {{ insights.stats?.total }} tracked · {{ insights.conversionRate }}% offer rate</p>
      <pre class="mt-2 whitespace-pre-wrap text-sm text-teal-200">{{ insights.aiInsight }}</pre>
    </div>

    <div v-if="introOffers.length" class="mt-6 card p-4">
      <h3 class="font-semibold text-slate-200">Referral marketplace</h3>
      <div v-for="o in introOffers" :key="o._id" class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div>
          <p class="text-sm text-slate-200">{{ o.fromUserName }} → {{ o.company }}</p>
          <p class="text-xs text-slate-500">{{ o.message || 'Intro offer' }} · {{ o.status }}</p>
        </div>
        <div v-if="o.status === 'pending' && o.toUserId === auth.user?.id" class="flex gap-2">
          <button class="btn-primary text-xs" @click="acceptIntro(o._id)">Accept & chat</button>
          <button class="btn-secondary text-xs" @click="declineIntro(o._id)">Decline</button>
        </div>
      </div>
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
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="addWatch">
        <input v-model="watchCompany" class="input max-w-xs" placeholder="Company to watch" required />
        <label class="flex items-center gap-2 text-sm text-slate-400">
          <input v-model="watchShared" type="checkbox" />
          Share with team
        </label>
        <button class="btn-primary">Add</button>
      </form>
      <div class="mt-4 space-y-2">
        <div v-for="w in watchlist" :key="w._id" class="card flex items-center justify-between p-4">
          <div>
            <p class="font-medium text-slate-200">
              {{ w.company }}
              <span v-if="w.isTeamShared" class="badge badge-teal ml-2 text-xs">Team</span>
              <span v-else-if="w.shared" class="badge badge-gold ml-2 text-xs">Shared</span>
            </p>
            <p class="text-sm text-slate-500">{{ w.jobCount }} roles · {{ w.topRole || 'No roles' }}</p>
          </div>
          <button v-if="!w.isTeamShared" class="btn-secondary text-xs" @click="removeWatch(w._id)">Remove</button>
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
          <p class="text-sm text-slate-500">{{ r.company }} · {{ r.replies?.length || 0 }} replies · {{ r.introOffers?.length || 0 }} intro offers</p>
          <div v-if="!isThreadOwner(r)" class="mt-3">
            <button
              v-if="offerThreadId !== r._id"
              class="btn-secondary text-xs"
              @click="offerThreadId = r._id"
            >
              Offer intro
            </button>
            <div v-else class="mt-2 flex gap-2">
              <input v-model="introMessage" class="input flex-1 text-sm" placeholder="Short intro note" />
              <button class="btn-primary text-xs" @click="offerIntro(r._id)">Send offer</button>
            </div>
          </div>
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
