<script setup>
import { onMounted, ref } from 'vue';
import http from '../api/http';
import { openLinkedIn } from '../utils/linkedin';

const posts = ref([]);
const loading = ref(false);
const generating = ref(false);
const error = ref('');
const message = ref('');
const focus = ref('devops_portfolio');
const count = ref(3);
const expandedId = ref('');
const copiedId = ref('');

const focusOptions = [
  { value: 'devops_portfolio', label: 'DevOps / platform portfolio' },
  { value: 'sre_reliability', label: 'SRE & reliability' },
  { value: 'cloud_cost', label: 'Cloud & FinOps' },
  { value: 'cicd_automation', label: 'CI/CD & automation' },
  { value: 'kubernetes', label: 'Kubernetes depth' },
];

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await http.get('/linkedin/visibility/posts');
    posts.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load project posts';
  } finally {
    loading.value = false;
  }
}

async function generate() {
  generating.value = true;
  error.value = '';
  message.value = '';
  try {
    const { data } = await http.post('/linkedin/visibility/posts/generate', {
      count: count.value,
      focus: focus.value,
    });
    posts.value = [...data.posts, ...posts.value.filter((p) => !data.posts.find((n) => n.id === p.id))];
    message.value = `Generated ${data.count} project idea(s) with LinkedIn post copy.`;
  } catch (e) {
    error.value = e.response?.data?.message || 'Generation failed';
  } finally {
    generating.value = false;
  }
}

async function copyPost(post) {
  await navigator.clipboard.writeText(post.linkedinPost);
  copiedId.value = post.id;
  setTimeout(() => { copiedId.value = ''; }, 2000);
}

function openLinkedInComposer() {
  openLinkedIn('https://www.linkedin.com/feed/');
}

async function markPosted(post) {
  try {
    const { data } = await http.post(`/linkedin/visibility/posts/${post.id}/posted`);
    const idx = posts.value.findIndex((p) => p.id === post.id);
    if (idx >= 0) posts.value[idx] = data;
    message.value = 'Marked as posted — keep the momentum going next week.';
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not update';
  }
}

async function removePost(post) {
  if (!confirm('Remove this project idea?')) return;
  await http.delete(`/linkedin/visibility/posts/${post.id}`);
  posts.value = posts.value.filter((p) => p.id !== post.id);
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? '' : id;
}

function postTypeLabel(type) {
  if (type === 'build_in_public') return 'Build in public';
  if (type === 'lesson_learned') return 'Lesson learned';
  return 'Project showcase';
}

onMounted(load);
</script>

<template>
  <div class="card p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold text-slate-200">LinkedIn visibility — project posts</h3>
        <p class="mt-1 max-w-2xl text-sm text-slate-400">
          Generate credible weekend-scale projects and ready-to-post LinkedIn copy while you apply.
          Ideas are based on <strong class="text-slate-300">your real skills</strong> — frame as build-in-public, not fake experience.
        </p>
      </div>
      <button type="button" class="btn-secondary text-sm" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <div>
        <label class="mb-1 block text-xs text-slate-500">Focus area</label>
        <select v-model="focus" class="input text-sm">
          <option v-for="opt in focusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Ideas to generate</label>
        <select v-model.number="count" class="input text-sm">
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="5">5</option>
        </select>
      </div>
      <div class="flex items-end">
        <button class="btn-primary w-full text-sm" :disabled="generating" @click="generate">
          {{ generating ? 'Generating…' : 'Generate project posts' }}
        </button>
      </div>
    </div>

    <p class="mt-4 rounded-lg border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-100/90">
      <strong class="text-sky-200">Cadence:</strong> 1–2 posts per week beats daily spam. Build the project (even a small lab), then post honestly about what you learned.
    </p>

    <p v-if="message" class="mt-3 text-sm text-teal-300">{{ message }}</p>
    <p v-if="error" class="mt-3 text-sm text-red-300">{{ error }}</p>

    <div v-if="loading" class="mt-6 text-sm text-slate-400">Loading ideas…</div>
    <div v-else-if="!posts.length" class="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
      No project posts yet. Click <strong class="text-slate-300">Generate project posts</strong> to get started.
    </div>

    <div v-else class="mt-6 space-y-4">
      <div
        v-for="post in posts"
        :key="post.id"
        class="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4"
        :class="post.status === 'posted' ? 'opacity-80' : ''"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="font-medium text-slate-100">{{ post.title }}</h4>
              <span class="badge badge-teal">{{ postTypeLabel(post.postType) }}</span>
              <span v-if="post.status === 'posted'" class="badge badge-gold">Posted</span>
              <span v-if="post.demo" class="badge badge-slate">Demo AI</span>
            </div>
            <p class="mt-1 text-sm text-slate-400">{{ post.summary }}</p>
            <p v-if="post.techStack?.length" class="mt-2 text-xs text-teal-300/80">
              {{ post.techStack.join(' · ') }}
              <span v-if="post.estimatedHours" class="text-slate-500"> · ~{{ post.estimatedHours }}h build</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          class="mt-3 text-xs text-slate-500 hover:text-slate-300"
          @click="toggleExpand(post.id)"
        >
          {{ expandedId === post.id ? 'Hide details' : 'Show build steps & post copy' }}
        </button>

        <div v-if="expandedId === post.id" class="mt-3 space-y-4 border-t border-slate-800 pt-3">
          <div v-if="post.buildSteps?.length">
            <p class="text-xs font-medium uppercase text-slate-500">Build steps</p>
            <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-400">
              <li v-for="(step, i) in post.buildSteps" :key="i">{{ step }}</li>
            </ol>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-slate-500">LinkedIn post</p>
            <pre class="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950/60 p-3 text-sm text-slate-300">{{ post.linkedinPost }}</pre>
          </div>
          <p v-if="post.visibilityTip" class="text-xs text-slate-500">{{ post.visibilityTip }}</p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn-primary px-3 py-1.5 text-xs" @click="copyPost(post)">
            {{ copiedId === post.id ? 'Copied!' : 'Copy post' }}
          </button>
          <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="openLinkedInComposer">
            Open LinkedIn →
          </button>
          <button
            v-if="post.status !== 'posted'"
            type="button"
            class="btn-secondary px-3 py-1.5 text-xs"
            @click="markPosted(post)"
          >
            Mark posted
          </button>
          <button type="button" class="px-3 py-1.5 text-xs text-slate-500 hover:text-red-300" @click="removePost(post)">
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
