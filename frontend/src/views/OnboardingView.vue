<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '../stores/profile';
import { useAuthStore } from '../stores/auth';
import AppLogo from '../components/AppLogo.vue';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();

const step = ref(1);
const saving = ref(false);
const error = ref('');

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

function listToText(arr) {
  return (arr || []).join('\n');
}

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
    router.push('/approvals');
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not save profile';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen safe-top safe-bottom px-4 py-8">
    <div class="mx-auto max-w-2xl">
      <AppLogo size="lg" />
      <h1 class="mt-6 text-2xl font-bold text-slate-100">Set up your profile</h1>
      <p class="mt-2 text-slate-400">RemoteMatch personalizes matches and AI cover letters for each user.</p>

      <div class="mt-6 flex gap-2">
        <div class="h-1 flex-1 rounded-full" :class="step >= 1 ? 'bg-teal-500' : 'bg-slate-800'" />
        <div class="h-1 flex-1 rounded-full" :class="step >= 2 ? 'bg-teal-500' : 'bg-slate-800'" />
        <div class="h-1 flex-1 rounded-full" :class="step >= 3 ? 'bg-teal-500' : 'bg-slate-800'" />
        <div class="h-1 flex-1 rounded-full" :class="step >= 4 ? 'bg-teal-500' : 'bg-slate-800'" />
      </div>

      <form class="card mt-8 space-y-4 p-6" @submit.prevent="step < 4 ? step++ : finish()">
        <template v-if="step === 1">
          <h2 class="font-semibold text-slate-200">About you</h2>
          <input v-model="form.displayName" required class="input" placeholder="Your name" />
          <input v-model="form.headline" class="input" placeholder="Headline e.g. DevOps Engineer · AWS · K8s" />
          <input v-model="form.linkedin" class="input" placeholder="LinkedIn URL" />
          <input v-model="form.github" class="input" placeholder="GitHub URL" />
          <input v-model="form.portfolio" class="input" placeholder="Portfolio URL" />
        </template>

        <template v-else-if="step === 2">
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

        <template v-else-if="step === 3">
          <h2 class="font-semibold text-slate-200">Resume summary</h2>
          <p class="text-sm text-slate-500">Paste key resume bullets so AI cover letters sound like you.</p>
          <textarea v-model="form.resumeText" rows="8" class="input text-sm" placeholder="Paste resume highlights…" />
        </template>

        <template v-else>
          <h2 class="font-semibold text-slate-200">Your apply workflow</h2>
          <ol class="list-decimal space-y-3 pl-5 text-sm text-slate-400">
            <li><strong class="text-teal-300">Browse Jobs</strong> — scored to your profile</li>
            <li><strong class="text-teal-300">Apply Queue</strong> — approve roles you want</li>
            <li><strong class="text-teal-300">Apply Approved</strong> — agent submits only those</li>
          </ol>
          <p class="text-sm text-slate-500">Next you'll land on your approval queue to review matches.</p>
        </template>

        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>

        <div class="flex gap-3 pt-2">
          <button v-if="step > 1" type="button" class="btn-secondary" @click="step--">Back</button>
          <button type="submit" class="btn-primary flex-1" :disabled="saving">
            {{ step < 4 ? 'Continue' : saving ? 'Saving…' : 'Go to Apply Queue' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
