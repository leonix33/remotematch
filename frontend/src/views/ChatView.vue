<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import http from '../api/http';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const tab = ref('ai');
const loading = ref(true);
const error = ref('');

// AI Coach
const aiMessages = ref([]);
const aiInput = ref('');
const aiSending = ref(false);
const aiDemo = ref(false);
const aiChatRef = ref(null);

// Team chat
const contacts = ref([]);
const conversations = ref([]);
const activeConversation = ref(null);
const messages = ref([]);
const messageInput = ref('');
const sending = ref(false);
const messagesRef = ref(null);

// Requests
const incoming = ref([]);
const showNewDm = ref(false);
const showNewGroup = ref(false);
const dmTarget = ref('');
const dmIntro = ref('');
const groupName = ref('');
const groupMembers = ref([]);
const requestSaving = ref(false);

const pendingCount = computed(() => incoming.value.length);

async function loadAiHistory() {
  try {
    const { data } = await http.get('/ai/history');
    aiMessages.value = data.filter((m) => m.role !== 'system');
  } catch {
    aiMessages.value = [];
  }
}

async function sendAi() {
  const text = aiInput.value.trim();
  if (!text || aiSending.value) return;
  aiInput.value = '';
  aiMessages.value.push({ role: 'user', content: text });
  aiSending.value = true;
  await scrollAi();
  try {
    const { data } = await http.post('/ai/chat', { message: text });
    aiMessages.value.push({ role: 'assistant', content: data.reply });
    aiDemo.value = data.demo;
  } catch (e) {
    error.value = e.response?.data?.message || 'AI unavailable';
  } finally {
    aiSending.value = false;
    await scrollAi();
  }
}

async function clearAi() {
  await http.delete('/ai/history');
  aiMessages.value = [];
}

async function loadChatData() {
  try {
    const [convRes, reqRes, contactRes] = await Promise.all([
      http.get('/chat/conversations'),
      http.get('/chat/requests/incoming'),
      http.get('/chat/contacts'),
    ]);
    conversations.value = convRes.data;
    incoming.value = reqRes.data;
    contacts.value = contactRes.data;
  } catch (e) {
    if (!error.value) error.value = e.response?.data?.message || 'Chat requires MongoDB';
  }
}

async function openConversation(conv) {
  activeConversation.value = conv;
  try {
    const { data } = await http.get(`/chat/conversations/${conv.id}/messages`);
    messages.value = data;
    await scrollMessages();
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load messages';
  }
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !activeConversation.value || sending.value) return;
  sending.value = true;
  try {
    const { data } = await http.post(`/chat/conversations/${activeConversation.value.id}/messages`, {
      content: text,
    });
    messages.value.push(data);
    messageInput.value = '';
    await scrollMessages();
    await loadChatData();
  } catch (e) {
    error.value = e.response?.data?.message || 'Send failed';
  } finally {
    sending.value = false;
  }
}

async function sendDmRequest() {
  if (!dmTarget.value) return;
  requestSaving.value = true;
  error.value = '';
  try {
    await http.post('/chat/requests', { toUserId: dmTarget.value, message: dmIntro.value });
    showNewDm.value = false;
    dmTarget.value = '';
    dmIntro.value = '';
    tab.value = 'requests';
    await loadChatData();
  } catch (e) {
    error.value = e.response?.data?.message || 'Request failed';
  } finally {
    requestSaving.value = false;
  }
}

async function createGroup() {
  if (!groupName.value || !groupMembers.value.length) return;
  requestSaving.value = true;
  error.value = '';
  try {
    await http.post('/chat/groups', { name: groupName.value, memberIds: groupMembers.value });
    showNewGroup.value = false;
    groupName.value = '';
    groupMembers.value = [];
    await loadChatData();
    tab.value = 'team';
  } catch (e) {
    error.value = e.response?.data?.message || 'Group creation failed';
  } finally {
    requestSaving.value = false;
  }
}

async function acceptRequest(id) {
  const { data } = await http.post(`/chat/requests/${id}/accept`);
  await loadChatData();
  if (data.conversationId) {
    const conv = conversations.value.find((c) => c.id === data.conversationId);
    if (conv) {
      tab.value = 'team';
      await openConversation(conv);
    } else {
      await loadChatData();
      const fresh = conversations.value.find((c) => c.id === data.conversationId);
      if (fresh) {
        tab.value = 'team';
        await openConversation(fresh);
      }
    }
  }
}

async function declineRequest(id) {
  await http.post(`/chat/requests/${id}/decline`);
  await loadChatData();
}

function toggleGroupMember(id) {
  const idx = groupMembers.value.indexOf(id);
  if (idx >= 0) groupMembers.value.splice(idx, 1);
  else groupMembers.value.push(id);
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isMine(senderId) {
  const myId = auth.user?.id;
  return senderId?.toString() === myId?.toString();
}

async function scrollAi() {
  await nextTick();
  if (aiChatRef.value) aiChatRef.value.scrollTop = aiChatRef.value.scrollHeight;
}

async function scrollMessages() {
  await nextTick();
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
}

let pollTimer;
onMounted(async () => {
  loading.value = true;
  await Promise.all([loadAiHistory(), loadChatData()]);
  loading.value = false;
  pollTimer = setInterval(() => {
    if (tab.value === 'team' && activeConversation.value) {
      http.get(`/chat/conversations/${activeConversation.value.id}/messages`).then(({ data }) => {
        messages.value = data;
      });
    }
    if (tab.value !== 'ai') loadChatData();
  }, 8000);
});

onUnmounted(() => clearInterval(pollTimer));

watch(tab, () => { error.value = ''; });
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-100">Connect</h2>
        <p class="mt-1 max-w-xl text-slate-400">
          AI career coach plus team messaging — compare notes, prep interviews, coordinate applies.
        </p>
      </div>
      <div v-if="pendingCount" class="badge badge-gold">{{ pendingCount }} pending invite{{ pendingCount > 1 ? 's' : '' }}</div>
    </div>

    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="t in [{ id: 'ai', label: 'AI Coach' }, { id: 'team', label: 'Messages' }, { id: 'requests', label: 'Invites' }]"
        :key="t.id"
        class="rounded-xl px-4 py-2 text-sm transition"
        :class="tab === t.id ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:bg-slate-800/60'"
        @click="tab = t.id"
      >
        {{ t.label }}
        <span v-if="t.id === 'requests' && pendingCount" class="ml-1 text-amber-300">({{ pendingCount }})</span>
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>
    <p v-if="aiDemo && tab === 'ai'" class="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
      Demo mode — add OPENAI_API_KEY on the server for live AI coaching.
    </p>

    <div v-if="loading" class="mt-8 text-slate-400">Loading…</div>

    <!-- AI Coach -->
    <div v-else-if="tab === 'ai'" class="card mt-6 flex h-[min(70vh,600px)] flex-col overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p class="font-medium text-teal-200">RemoteMatch AI Coach</p>
          <p class="text-xs text-slate-500">Resume, interviews, negotiation, strategy</p>
        </div>
        <button class="btn-secondary px-3 py-1 text-xs" @click="clearAi">Clear</button>
      </div>
      <div ref="aiChatRef" class="flex-1 space-y-4 overflow-y-auto p-4">
        <div
          v-if="!aiMessages.length"
          class="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500"
        >
          Ask anything: "How do I answer system design for SRE?" or "Review my approach to Stripe's DevOps role."
        </div>
        <div
          v-for="(msg, i) in aiMessages"
          :key="i"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
            :class="msg.role === 'user' ? 'bg-teal-600/30 text-teal-100' : 'bg-slate-800/80 text-slate-200'"
          >
            {{ msg.content }}
          </div>
        </div>
        <div v-if="aiSending" class="text-sm text-slate-500">Thinking…</div>
      </div>
      <form class="flex gap-2 border-t border-slate-800 p-4" @submit.prevent="sendAi">
        <input v-model="aiInput" class="input flex-1" placeholder="Ask your career coach…" :disabled="aiSending" />
        <button type="submit" class="btn-primary" :disabled="aiSending || !aiInput.trim()">Send</button>
      </form>
    </div>

    <!-- Team messages -->
    <div v-else-if="tab === 'team'" class="mt-6 grid gap-4 lg:grid-cols-3">
      <div class="card overflow-hidden lg:col-span-1">
        <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <p class="font-medium text-slate-200">Chats</p>
          <div class="flex gap-1">
            <button class="btn-secondary px-2 py-1 text-xs" @click="showNewDm = true">DM</button>
            <button class="btn-secondary px-2 py-1 text-xs" @click="showNewGroup = true">Group</button>
          </div>
        </div>
        <div class="max-h-[min(60vh,500px)] overflow-y-auto">
          <button
            v-for="conv in conversations"
            :key="conv.id"
            class="flex w-full flex-col gap-0.5 border-b border-slate-800/60 px-4 py-3 text-left transition hover:bg-slate-800/40"
            :class="activeConversation?.id === conv.id ? 'bg-teal-500/10' : ''"
            @click="openConversation(conv)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-slate-200 truncate">{{ conv.title }}</span>
              <span v-if="conv.type === 'group'" class="badge badge-teal text-[10px]">group</span>
            </div>
            <p class="truncate text-xs text-slate-500">{{ conv.lastMessagePreview || 'No messages yet' }}</p>
          </button>
          <p v-if="!conversations.length" class="p-4 text-sm text-slate-500">No chats yet. Send an invite or create a group.</p>
        </div>
      </div>

      <div class="card flex h-[min(60vh,500px)] flex-col overflow-hidden lg:col-span-2">
        <template v-if="activeConversation">
          <div class="border-b border-slate-800 px-4 py-3">
            <p class="font-medium text-slate-200">{{ activeConversation.title }}</p>
            <p class="text-xs text-slate-500">
              {{ activeConversation.members?.map((m) => m.name).filter(Boolean).join(', ') }}
            </p>
          </div>
          <div ref="messagesRef" class="flex-1 space-y-3 overflow-y-auto p-4">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.type === 'system' ? 'justify-center' : isMine(msg.senderId) ? 'justify-end' : 'justify-start'"
            >
              <div
                v-if="msg.type === 'system'"
                class="text-xs text-slate-500"
              >
                {{ msg.senderName }} {{ msg.content }} · {{ formatTime(msg.createdAt) }}
              </div>
              <div
                v-else
                class="max-w-[80%] rounded-2xl px-4 py-2 text-sm"
                :class="isMine(msg.senderId) ? 'bg-teal-600/30 text-teal-100' : 'bg-slate-800/80 text-slate-200'"
              >
                <p v-if="!isMine(msg.senderId)" class="mb-0.5 text-xs text-slate-400">{{ msg.senderName }}</p>
                {{ msg.content }}
                <p class="mt-1 text-[10px] opacity-60">{{ formatTime(msg.createdAt) }}</p>
              </div>
            </div>
          </div>
          <form class="flex gap-2 border-t border-slate-800 p-4" @submit.prevent="sendMessage">
            <input v-model="messageInput" class="input flex-1" placeholder="Type a message…" />
            <button type="submit" class="btn-primary" :disabled="sending || !messageInput.trim()">Send</button>
          </form>
        </template>
        <div v-else class="flex flex-1 items-center justify-center text-sm text-slate-500">
          Select a conversation or start a new chat
        </div>
      </div>
    </div>

    <!-- Invites -->
    <div v-else-if="tab === 'requests'" class="mt-6 space-y-4">
      <div class="flex gap-2">
        <button class="btn-secondary text-sm" @click="showNewDm = true">New direct message</button>
        <button class="btn-secondary text-sm" @click="showNewGroup = true">New group</button>
      </div>
      <div v-for="req in incoming" :key="req.id" class="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p class="font-medium text-slate-200">
            <span v-if="req.type === 'group'">Group invite: {{ req.conversation?.name }}</span>
            <span v-else>{{ req.from?.name }} wants to chat</span>
          </p>
          <p class="text-sm text-slate-500">{{ req.from?.email }}</p>
          <p v-if="req.introMessage" class="mt-2 text-sm text-slate-400">"{{ req.introMessage }}"</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary px-4 py-2 text-sm" @click="acceptRequest(req.id)">Accept</button>
          <button class="btn-secondary px-4 py-2 text-sm" @click="declineRequest(req.id)">Decline</button>
        </div>
      </div>
      <p v-if="!incoming.length" class="text-slate-500">No pending invites.</p>
    </div>

    <!-- New DM modal -->
    <div v-if="showNewDm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showNewDm = false">
      <form class="card w-full max-w-md p-6" @submit.prevent="sendDmRequest">
        <h3 class="font-semibold text-slate-200">Start a conversation</h3>
        <p class="mt-1 text-sm text-slate-500">They must accept before you can chat.</p>
        <select v-model="dmTarget" required class="input mt-4">
          <option value="" disabled>Select teammate</option>
          <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.name }} ({{ c.email }})</option>
        </select>
        <textarea v-model="dmIntro" rows="3" class="input mt-3" placeholder="Intro message (optional)" />
        <div class="mt-6 flex gap-3">
          <button type="button" class="btn-secondary flex-1" @click="showNewDm = false">Cancel</button>
          <button type="submit" class="btn-primary flex-1" :disabled="requestSaving">Send invite</button>
        </div>
      </form>
    </div>

    <!-- New group modal -->
    <div v-if="showNewGroup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showNewGroup = false">
      <form class="card w-full max-w-md p-6" @submit.prevent="createGroup">
        <h3 class="font-semibold text-slate-200">Create group chat</h3>
        <input v-model="groupName" required class="input mt-4" placeholder="Group name" />
        <p class="mt-4 text-sm text-slate-400">Invite members (must accept):</p>
        <div class="mt-2 max-h-48 space-y-2 overflow-y-auto">
          <label
            v-for="c in contacts"
            :key="c.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800/60"
          >
            <input type="checkbox" :checked="groupMembers.includes(c.id)" @change="toggleGroupMember(c.id)" />
            <span class="text-sm text-slate-300">{{ c.name }}</span>
          </label>
        </div>
        <div class="mt-6 flex gap-3">
          <button type="button" class="btn-secondary flex-1" @click="showNewGroup = false">Cancel</button>
          <button type="submit" class="btn-primary flex-1" :disabled="requestSaving">Create & invite</button>
        </div>
      </form>
    </div>
  </div>
</template>
