<script setup>
import { ref } from 'vue';
import http from '../api/http';

const jobTitle = ref('');
const company = ref('');
const tone = ref('Professional');
const goal = ref('Highlight cloud, DevOps, and Databricks experience');
const content = ref('');
const demo = ref(false);
const loading = ref(false);
const error = ref('');
const copied = ref(false);

async function generate() {
  error.value = '';
  loading.value = true;
  content.value = '';
  try {
    const { data } = await http.post('/generations', {
      jobTitle: jobTitle.value,
      company: company.value,
      tone: tone.value,
      goal: goal.value,
    });
    content.value = data.content;
    demo.value = data.demo;
  } catch (e) {
    error.value = e.response?.data?.message || 'Generation failed';
  } finally {
    loading.value = false;
  }
}

async function copy() {
  await navigator.clipboard.writeText(content.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">Cover Letter Generator</h2>
    <p class="mt-1 text-slate-400">AI-powered application copy for your target roles</p>

    <div class="mt-8 grid gap-8 lg:grid-cols-2">
      <form class="card space-y-4 p-6" @submit.prevent="generate">
        <div>
          <label class="mb-1 block text-sm text-slate-400">Job title</label>
          <input v-model="jobTitle" required class="input" placeholder="Senior DevOps Engineer" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Company</label>
          <input v-model="company" required class="input" placeholder="Databricks" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Tone</label>
          <select v-model="tone" class="input">
            <option>Professional</option>
            <option>Confident</option>
            <option>Warm</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Goal</label>
          <textarea v-model="goal" rows="3" class="input" />
        </div>
        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Generating…' : 'Generate cover letter' }}
        </button>
      </form>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-200">Result</h3>
          <span v-if="demo" class="badge badge-gold">Demo mode</span>
        </div>
        <p v-if="!content && !loading" class="mt-4 text-slate-500">Generated text will appear here.</p>
        <pre v-else class="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{{ content }}</pre>
        <button v-if="content" class="btn-secondary mt-4" @click="copy">
          {{ copied ? 'Copied!' : 'Copy to clipboard' }}
        </button>
      </div>
    </div>
  </div>
</template>
