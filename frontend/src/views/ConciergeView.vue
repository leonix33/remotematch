<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';

const router = useRouter();
const input = ref('');
const listening = ref(false);
const sending = ref(false);
const messages = ref([]);
const actions = ref([]);
const demo = ref(false);
const error = ref('');
const chatRef = ref(null);
const snapshot = ref(null);

const suggestions = [
  'What needs my attention today?',
  'Summarize my apply pipeline',
  'Best pending jobs to review',
  'How do I enable LinkedIn auto-queue?',
  'Where are my tailored resumes?',
];

let recognition = null;

async function scrollBottom() {
  await nextTick();
  if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight;
}

async function send(text) {
  const message = (text || input.value).trim();
  if (!message || sending.value) return;
  input.value = '';
  error.value = '';
  messages.value.push({ role: 'user', content: message });
  sending.value = true;
  actions.value = [];
  await scrollBottom();

  try {
    const history = messages.value
      .slice(0, -1)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const { data } = await http.post('/concierge/ask', { message, history });
    messages.value.push({ role: 'assistant', content: data.reply });
    actions.value = data.actions || [];
    demo.value = Boolean(data.demo);
  } catch (e) {
    error.value = e.response?.data?.message || 'Concierge unavailable';
  } finally {
    sending.value = false;
    await scrollBottom();
  }
}

function runAction(action) {
  if (action.type === 'navigate' && action.path) router.push(action.path);
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    error.value = 'Voice not supported — type your question.';
    return;
  }
  if (listening.value) {
    recognition?.stop();
    return;
  }
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => { listening.value = true; error.value = ''; };
  recognition.onend = () => { listening.value = false; };
  recognition.onerror = () => { listening.value = false; error.value = 'Could not hear you.'; };
  recognition.onresult = (e) => send(e.results[0][0].transcript);
  recognition.start();
}

onMounted(async () => {
  messages.value.push({
    role: 'assistant',
    content: 'Welcome to remotelymatch Concierge. I know your queue, jobs, and applications — ask me where to go or what to do next.',
  });
  try {
    const { data } = await http.get('/concierge/snapshot');
    snapshot.value = data;
  } catch { /* ignore */ }
});

onUnmounted(() => recognition?.stop());
</script>

<template>
  <div class="concierge-page">
    <header class="concierge-page-header">
      <div>
        <p class="concierge-eyebrow">AI Concierge</p>
        <h1 class="text-2xl font-bold text-slate-50">Ask anything</h1>
        <p class="mt-1 text-sm text-slate-400">Voice or text — grounded in your live job search data</p>
      </div>
      <div v-if="snapshot?.queue" class="concierge-stats">
        <div class="concierge-stat"><span>{{ snapshot.queue.pending }}</span><small>Pending</small></div>
        <div class="concierge-stat"><span>{{ snapshot.queue.approved }}</span><small>Approved</small></div>
        <div class="concierge-stat"><span>{{ snapshot.pipeline?.submitted ?? '—' }}</span><small>Submitted</small></div>
      </div>
    </header>

    <div v-if="demo" class="concierge-demo-banner">Demo mode — connect OpenAI in Profile</div>

    <div ref="chatRef" class="concierge-page-messages custom-scrollbar">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="concierge-bubble"
        :class="msg.role === 'user' ? 'concierge-bubble-user' : 'concierge-bubble-ai'"
      >
        {{ msg.content }}
      </div>
      <div v-if="sending" class="concierge-bubble concierge-bubble-ai">Thinking…</div>
    </div>

    <div v-if="actions.length" class="concierge-actions concierge-actions-inline">
      <button v-for="(a, i) in actions" :key="i" type="button" class="concierge-action-btn" @click="runAction(a)">
        {{ a.label || 'Open' }} →
      </button>
    </div>

    <div v-if="messages.length <= 1" class="concierge-chips">
      <button v-for="chip in suggestions" :key="chip" type="button" class="concierge-chip" @click="send(chip)">{{ chip }}</button>
    </div>

    <p v-if="error" class="concierge-error">{{ error }}</p>

    <form class="concierge-input-row concierge-input-row-page" @submit.prevent="send()">
      <button type="button" class="concierge-mic" :class="listening ? 'concierge-mic-active' : ''" @click="startVoice">🎙</button>
      <input v-model="input" class="concierge-input" placeholder="e.g. What should I review first?" :disabled="sending" />
      <button type="submit" class="btn-primary concierge-send-page" :disabled="sending || !input.trim()">Send</button>
    </form>
  </div>
</template>
