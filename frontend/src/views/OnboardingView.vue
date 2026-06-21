<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '../stores/profile';
import { useAuthStore } from '../stores/auth';
import ResumeUpload from '../components/ResumeUpload.vue';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();

const steps = [
  { label: 'Profile' },
  { label: 'Resume' },
  { label: 'Skills' },
  { label: 'Links' },
];

const step = ref(1);
const saving = ref(false);
const error = ref('');

function mergeLines(existing, incoming) {
  const lines = String(existing || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set(lines.map((s) => s.toLowerCase()));
  for (const skill of incoming || []) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(skill);
    }
  }
  return lines.join('\n');
}

function onResumeParsed(result) {
  form.value.resumeText = result.resumeText;
  if (result.extractedSkills?.mustHave?.length) {
    form.value.mustHaveSkills = mergeLines(form.value.mustHaveSkills, result.extractedSkills.mustHave);
  }
  if (result.extractedSkills?.niceToHave?.length) {
    form.value.niceToHaveSkills = mergeLines(form.value.niceToHaveSkills, result.extractedSkills.niceToHave);
  }
  if (!form.value.headline?.trim() && result.suggestedHeadline) {
    form.value.headline = result.suggestedHeadline;
  }
  if (result.suggestedTitles?.length) {
    form.value.targetTitles = mergeLines(form.value.targetTitles, result.suggestedTitles);
  }
}

const form = ref({
  displayName: auth.user?.name || '',
  headline: '',
  linkedin: '',
  github: '',
  portfolio: '',
  targetTitles: 'devops engineer\nsite reliability engineer\nplatform engineer\ncloud engineer',
  mustHaveSkills: 'kubernetes\nterraform\naws\nazure\ndocker\nlinux\npython\nci/cd',
  niceToHaveSkills: 'databricks\nobservability\nprometheus\ngrafana',
  resumeText: '',
});

async function finish() {
  error.value = '';
  saving.value = true;
  try {
    await profileStore.save({
      ...form.value,
      targetTitles: form.value.targetTitles.split('\n').filter(Boolean),
      mustHaveSkills: form.value.mustHaveSkills.split('\n').filter(Boolean),
      niceToHaveSkills: form.value.niceToHaveSkills.split('\n').filter(Boolean),
      onboardingComplete: true,
    });
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not save profile';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen safe-top px-4 pb-4 pt-4 lg:py-8">
    <div class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold text-slate-100">Complete Your Profile</h1>
      <p class="mt-1 text-slate-400">Let's personalize your job matches.</p>

      <div class="mt-5 rounded-2xl border border-teal-900/30 bg-slate-900/50 p-4">
        <p class="font-medium text-slate-200">Get matched to remote jobs faster.</p>
        <p class="mt-2 text-sm text-slate-400">Complete your profile to:</p>
        <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
          <li class="flex items-start gap-2">
            <span class="text-teal-400">✓</span>
            Improve job recommendations
          </li>
          <li class="flex items-start gap-2">
            <span class="text-teal-400">✓</span>
            Generate tailored cover letters
          </li>
          <li class="flex items-start gap-2">
            <span class="text-teal-400">✓</span>
            Track applications
          </li>
        </ul>
      </div>

      <div class="mt-6">
        <p class="text-sm font-medium text-slate-300">Step {{ step }} of {{ steps.length }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <template v-for="(s, i) in steps" :key="s.label">
            <span
              :class="step === i + 1 ? 'font-semibold text-teal-300' : step > i + 1 ? 'text-teal-500/70' : 'text-slate-600'"
            >
              {{ s.label }}
            </span>
            <span v-if="i < steps.length - 1" class="text-slate-700">→</span>
          </template>
        </div>
        <div class="mt-3 flex gap-2">
          <div
            v-for="(_, i) in steps"
            :key="i"
            class="h-1 flex-1 rounded-full transition-colors"
            :class="step > i ? 'bg-teal-500' : 'bg-slate-800'"
          />
        </div>
      </div>

      <form class="card relative mt-6 space-y-4 p-6 pb-28 sm:pb-6" @submit.prevent="step < 4 ? step++ : finish()">
        <template v-if="step === 1">
          <h2 class="font-semibold text-slate-200">About you</h2>
          <input v-model="form.displayName" required class="input" placeholder="Your name" />
          <input
            v-model="form.headline"
            class="input"
            placeholder="Platform Engineer | Azure | Databricks | Terraform"
          />
        </template>

        <template v-else-if="step === 2">
          <h2 class="font-semibold text-slate-200">Resume</h2>
          <p class="text-sm text-slate-500">
            Upload or paste your resume so we can tailor cover letters and improve match quality.
          </p>
          <ResumeUpload v-model="form.resumeText" @parsed="onResumeParsed" />
          <textarea
            v-model="form.resumeText"
            rows="8"
            class="input text-sm"
            placeholder="Paste key resume bullets, experience, and skills…"
          />
        </template>

        <template v-else-if="step === 3">
          <h2 class="font-semibold text-slate-200">Target roles & skills</h2>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Target job titles (one per line)</label>
            <textarea v-model="form.targetTitles" rows="5" class="input font-mono text-sm" required />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Must-have skills</label>
            <textarea v-model="form.mustHaveSkills" rows="4" class="input font-mono text-sm" required />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Nice-to-have skills</label>
            <textarea v-model="form.niceToHaveSkills" rows="3" class="input font-mono text-sm" />
          </div>
        </template>

        <template v-else>
          <h2 class="font-semibold text-slate-200">Professional links</h2>
          <p class="text-sm text-slate-500">Most job seekers have LinkedIn — add what you have.</p>
          <input v-model="form.linkedin" class="input" placeholder="https://linkedin.com/in/your-profile" />
          <input v-model="form.github" class="input" placeholder="https://github.com/your-username" />
          <input v-model="form.portfolio" class="input" placeholder="https://your-portfolio.com" />

          <div class="rounded-xl border border-teal-900/30 bg-slate-800/30 p-4">
            <h3 class="text-sm font-semibold text-slate-200">Your apply workflow</h3>
            <ol class="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-400">
              <li><strong class="text-teal-300">Browse Jobs</strong> — scored to your profile</li>
              <li><strong class="text-teal-300">Apply Queue</strong> — approve roles you want</li>
              <li><strong class="text-teal-300">Apply Approved</strong> — agent submits only those</li>
            </ol>
          </div>
        </template>

        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>

        <div
          class="onboarding-actions safe-bottom fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-800 bg-slate-950/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2"
        >
          <button v-if="step > 1" type="button" class="btn-secondary" @click="step--">Back</button>
          <button type="submit" class="btn-primary btn-continue flex-1" :disabled="saving">
            <span>{{ step < 4 ? 'Continue' : saving ? 'Saving…' : 'Go to Dashboard' }}</span>
            <span v-if="step < 4 && !saving" class="ml-1" aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
