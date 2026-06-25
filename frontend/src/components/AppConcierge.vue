<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';

const router = useRouter();

const open = ref(false);
const input = ref('');
const listening = ref(false);
const sending = ref(false);
const messages = ref([]);
const actions = ref([]);
const demo = ref(false);
const error = ref('');
const chatRef = ref(null);

const suggestions = [
  'What needs my attention today?',
  'How many jobs are in my queue?',
  'Show me my best pending matches',
  'Where do I tailor a resume?',
  'Open my follow-ups',
];

let recognition = null;

function toggle() {
  open.value = !open.value;
  if (open.value && !messages.value.length) {
    messages.value.push({
      role: 'assistant',
      content: 'Hi — I’m your RemoteMatch concierge. Ask me anything about your jobs, queue, or where to go in the app. Type or tap the mic.',
    });
  }
}

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
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const { data } = await http.post('/concierge/ask', {
      message,
      history: history.slice(0, -1),
    });

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
  if (action.type === 'navigate' && action.path) {
    router.push(action.path);
    open.value = false;
  }
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    error.value = 'Voice not supported in this browser — type your question instead.';
    return;
  }
  if (listening.value) {
    recognition?.stop();
    return;
  }
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    listening.value = true;
    error.value = '';
  };
  recognition.onend = () => {
    listening.value = false;
  };
  recognition.onerror = () => {
    listening.value = false;
    error.value = 'Could not hear you — try again or type.';
  };
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    input.value = transcript;
    send(transcript);
  };
  recognition.start();
}

onUnmounted(() => {
  recognition?.stop();
});
</script>

<template>
  <div class="concierge-root" :class="open ? 'concierge-open' : ''">
    <Transition name="concierge-panel">
      <div v-if="open" class="concierge-panel">
        <header class="concierge-header">
          <div>
            <p class="concierge-eyebrow">RemoteMatch</p>
            <h2 class="concierge-title">Concierge</h2>
            <p class="concierge-sub">Ask about your jobs, queue, or where to go — voice or text</p>
          </div>
          <button type="button" class="concierge-close" aria-label="Close" @click="open = false">×</button>
        </header>

        <div v-if="demo" class="concierge-demo-banner">Demo mode — connect OpenAI in Profile for full answers</div>

        <div ref="chatRef" class="concierge-messages custom-scrollbar">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="concierge-bubble"
            :class="msg.role === 'user' ? 'concierge-bubble-user' : 'concierge-bubble-ai'"
          >
            {{ msg.content }}
          </div>
          <div v-if="sending" class="concierge-bubble concierge-bubble-ai concierge-typing">Thinking…</div>
        </div>

        <div v-if="actions.length" class="concierge-actions">
          <button
            v-for="(action, i) in actions"
            :key="i"
            type="button"
            class="concierge-action-btn"
            @click="runAction(action)"
          >
            {{ action.label || 'Open' }} →
          </button>
        </div>

        <div v-if="messages.length <= 1" class="concierge-chips">
          <button
            v-for="chip in suggestions"
            :key="chip"
            type="button"
            class="concierge-chip"
            @click="send(chip)"
          >
            {{ chip }}
          </button>
        </div>

        <p v-if="error" class="concierge-error">{{ error }}</p>

        <form class="concierge-input-row" @submit.prevent="send()">
          <button
            type="button"
            class="concierge-mic"
            :class="listening ? 'concierge-mic-active' : ''"
            :title="listening ? 'Stop listening' : 'Speak'"
            @click="startVoice"
          >
            {{ listening ? '◉' : '🎙' }}
          </button>
          <input
            v-model="input"
            type="text"
            class="concierge-input"
            placeholder="Ask anything about your job search…"
            :disabled="sending"
          />
          <button type="submit" class="concierge-send" :disabled="sending || !input.trim()">↑</button>
        </form>
      </div>
    </Transition>

    <button type="button" class="concierge-fab" aria-label="Open concierge" @click="toggle">
      <span v-if="!open" class="concierge-fab-icon">✦</span>
      <span v-else class="concierge-fab-icon">↓</span>
      <span class="concierge-fab-label">{{ open ? 'Close' : 'Ask AI' }}</span>
    </button>
  </div>
</template>
