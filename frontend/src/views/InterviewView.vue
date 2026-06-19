<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';

const sessions = ref([]);
const active = ref(null);
const answer = ref('');
const sending = ref(false);
const form = ref({ jobTitle: 'Senior DevOps Engineer', company: 'Tech Corp', mode: 'text' });
const feedback = ref(null);
const voiceMode = ref(false);

async function loadSessions() {
  const { data } = await http.get('/interview');
  sessions.value = data;
}

async function start() {
  const { data } = await http.post('/interview/start', form.value);
  active.value = data;
  feedback.value = null;
}

async function respond() {
  if (!answer.value.trim() || !active.value) return;
  sending.value = true;
  try {
    const { data } = await http.post(`/interview/${active.value._id}/respond`, { answer: answer.value });
    active.value.turns.push({ role: 'candidate', content: answer.value });
    active.value.turns.push({ role: 'interviewer', content: data.turn });
    answer.value = '';
    if (data.turnCount >= 4) {
      await endSession();
    }
  } finally {
    sending.value = false;
  }
}

async function endSession() {
  if (!active.value) return;
  const { data } = await http.post(`/interview/${active.value._id}/end`);
  feedback.value = data;
  active.value = null;
  await loadSessions();
}

function speak(text) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }
}

function startVoiceAnswer() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  const rec = new SR();
  rec.onresult = (e) => { answer.value = e.results[0][0].transcript; };
  rec.start();
}

onMounted(loadSessions);
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-100">Interview Simulator</h2>
    <p class="mt-1 text-slate-400">AI hiring manager — text or voice mock interviews with scored feedback</p>

    <form v-if="!active" class="card mt-6 grid gap-4 p-6 md:grid-cols-3" @submit.prevent="start">
      <input v-model="form.jobTitle" class="input" placeholder="Job title" required />
      <input v-model="form.company" class="input" placeholder="Company" required />
      <select v-model="form.mode" class="input">
        <option value="text">Text mode</option>
        <option value="voice">Voice mode</option>
      </select>
      <button type="submit" class="btn-primary md:col-span-3">Start mock interview</button>
    </form>

    <div v-if="active" class="card mt-6 flex h-[min(65vh,550px)] flex-col">
      <div class="border-b border-slate-800 px-4 py-3">
        <p class="font-medium text-slate-200">{{ form.jobTitle }} @ {{ form.company }}</p>
        <label class="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <input v-model="voiceMode" type="checkbox" /> Read questions aloud
        </label>
      </div>
      <div class="flex-1 space-y-3 overflow-y-auto p-4">
        <div
          v-for="(t, i) in active.turns"
          :key="i"
          class="flex"
          :class="t.role === 'interviewer' ? 'justify-start' : 'justify-end'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2 text-sm"
            :class="t.role === 'interviewer' ? 'bg-slate-800 text-slate-200' : 'bg-teal-600/30 text-teal-100'"
          >
            {{ t.content }}
            <button
              v-if="t.role === 'interviewer' && voiceMode"
              class="ml-2 text-xs text-teal-400"
              @click="speak(t.content)"
            >🔊</button>
          </div>
        </div>
      </div>
      <form class="flex gap-2 border-t border-slate-800 p-4" @submit.prevent="respond">
        <input v-model="answer" class="input flex-1" placeholder="Your answer…" />
        <button type="button" class="btn-secondary" @click="startVoiceAnswer">🎤</button>
        <button type="submit" class="btn-primary" :disabled="sending">Reply</button>
        <button type="button" class="btn-secondary" @click="endSession">End</button>
      </form>
    </div>

    <div v-if="feedback" class="card mt-6 p-6">
      <p class="text-2xl font-bold text-teal-300">Score: {{ feedback.score }}/100</p>
      <pre class="mt-4 whitespace-pre-wrap text-sm text-slate-300">{{ feedback.summary }}</pre>
    </div>

    <div v-if="sessions.length" class="mt-8">
      <h3 class="font-semibold text-slate-200">Past sessions</h3>
      <div class="mt-3 space-y-2">
        <div v-for="s in sessions" :key="s._id" class="card p-3 text-sm text-slate-400">
          {{ s.jobTitle }} @ {{ s.company }} — {{ s.score ? `${s.score}/100` : 'in progress' }}
        </div>
      </div>
    </div>
  </div>
</template>
