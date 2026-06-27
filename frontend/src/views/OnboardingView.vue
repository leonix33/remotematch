<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '../stores/profile';
import { useAuthStore } from '../stores/auth';
import ResumeUpload from '../components/ResumeUpload.vue';
import ResumePreview from '../components/ResumePreview.vue';
import TailorApplySettings from '../components/TailorApplySettings.vue';
import { useProfileAutosave } from '../composables/useProfileAutosave';
import { applyParseResultToForm } from '../utils/resumeProfileFill';
import {
  clearOnboardingStep,
  readOnboardingStep,
  writeOnboardingStep,
} from '../utils/profileDraft';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();
const { saveState, schedule, flush } = useProfileAutosave({ delay: 700 });

const steps = [
  { label: 'Resume', hint: 'Upload once — we fill in the rest' },
  { label: 'Your profile', hint: 'Review what we found' },
  { label: 'Apply', hint: 'Tailoring & email' },
];

const step = ref(1);
const saving = ref(false);
const error = ref('');
const autosaveEnabled = ref(false);
const resumeParsed = ref(false);

const resumeMode = ref('tailored');
const supplementPages = ref(3);
const tailorMode = ref('balanced');
const digestEmail = ref('');
const contactPhone = ref('');

const form = ref({
  displayName: auth.user?.name || '',
  applicantName: auth.user?.name || '',
  headline: '',
  linkedin: '',
  github: '',
  portfolio: '',
  targetTitles: '',
  mustHaveSkills: '',
  niceToHaveSkills: '',
  resumeText: '',
});

const hasResume = computed(() => form.value.resumeText.trim().length >= 50);

function draftPayload() {
  return {
    displayName: form.value.displayName || form.value.applicantName,
    applicantName: form.value.applicantName,
    headline: form.value.headline,
    linkedin: form.value.linkedin,
    github: form.value.github,
    portfolio: form.value.portfolio,
    resumeText: form.value.resumeText,
    targetTitles: form.value.targetTitles.split('\n').filter(Boolean),
    mustHaveSkills: form.value.mustHaveSkills.split('\n').filter(Boolean),
    niceToHaveSkills: form.value.niceToHaveSkills.split('\n').filter(Boolean),
    contactPhone: contactPhone.value.trim(),
    digestEmail: digestEmail.value.trim(),
    defaultApplyResumeMode: resumeMode.value,
    defaultSupplementPages: supplementPages.value,
    defaultTailorMode: tailorMode.value,
    onboardingComplete: false,
  };
}

function loadFromProfile(p) {
  if (!p) return;
  form.value.displayName = p.displayName || form.value.displayName || auth.user?.name || '';
  form.value.applicantName = p.applicantName || p.displayName || form.value.applicantName || auth.user?.name || '';
  form.value.headline = p.headline || '';
  form.value.linkedin = p.linkedin || '';
  form.value.github = p.github || '';
  form.value.portfolio = p.portfolio || '';
  form.value.resumeText = p.resumeText || '';
  if (p.targetTitles?.length) form.value.targetTitles = p.targetTitles.join('\n');
  if (p.mustHaveSkills?.length) form.value.mustHaveSkills = p.mustHaveSkills.join('\n');
  if (p.niceToHaveSkills?.length) form.value.niceToHaveSkills = p.niceToHaveSkills.join('\n');
  digestEmail.value = p.digestEmail || auth.user?.email || '';
  contactPhone.value = p.contactPhone || '';
  resumeMode.value = p.defaultApplyResumeMode === 'base' ? 'base' : 'tailored';
  supplementPages.value = p.defaultSupplementPages || 3;
  tailorMode.value = p.defaultTailorMode === 'high_match' ? 'high_match' : 'balanced';
  if (hasResume.value) resumeParsed.value = true;
}

function onResumeParsed(result) {
  const extras = applyParseResultToForm(form.value, result, {
    authEmail: auth.user?.email || '',
    onlyIfEmpty: true,
  });
  if (!digestEmail.value.trim() && extras.digestEmail) {
    digestEmail.value = extras.digestEmail;
  }
  if (!contactPhone.value.trim() && extras.contactPhone) {
    contactPhone.value = extras.contactPhone;
  }
  resumeParsed.value = true;
}

watch(
  [form, resumeMode, supplementPages, tailorMode, digestEmail, contactPhone],
  () => {
    if (!autosaveEnabled.value || !profileStore.loaded) return;
    schedule(draftPayload);
    writeOnboardingStep(auth.user?.id, step.value);
  },
  { deep: true }
);

async function finish() {
  error.value = '';
  if (!hasResume.value) {
    error.value = 'Please upload or paste your resume first.';
    step.value = 1;
    return;
  }
  if (!digestEmail.value.trim()) {
    error.value = 'Add your personal email — applications need your real address.';
    step.value = 3;
    return;
  }
  if (!form.value.applicantName.trim()) {
    error.value = 'Add the name employers should see on your applications.';
    step.value = 2;
    return;
  }
  saving.value = true;
  try {
    await profileStore.save({
      ...draftPayload(),
      onboardingComplete: true,
    });
    clearOnboardingStep(auth.user?.id);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not save profile';
  } finally {
    saving.value = false;
  }
}

async function goNext() {
  if (step.value === 1 && !hasResume.value) {
    error.value = 'Upload your resume (PDF or Word) — or paste the text below.';
    return;
  }
  if (step.value === 2 && !form.value.applicantName.trim()) {
    error.value = 'Enter the name employers should see on applications.';
    return;
  }
  if (step.value === 3 && !digestEmail.value.trim()) {
    error.value = 'Add your personal email before continuing.';
    return;
  }
  error.value = '';
  await flush(draftPayload);
  writeOnboardingStep(auth.user?.id, step.value + 1);
  step.value += 1;
}

onMounted(async () => {
  const savedStep = readOnboardingStep(auth.user?.id);
  step.value = savedStep >= 1 && savedStep <= 3 ? savedStep : 1;
  if (!profileStore.loaded) {
    profileStore.hydrateFromCache();
    await profileStore.fetch().catch(() => {});
  }
  loadFromProfile(profileStore.profile);
  if (!digestEmail.value.trim()) {
    digestEmail.value = auth.user?.email || '';
  }
  autosaveEnabled.value = true;
  if (profileStore.profile?.onboardingComplete) {
    router.replace('/');
  } else if (!hasResume.value) {
    step.value = 1;
  }
});
</script>

<template>
  <div class="min-h-screen safe-top px-4 pb-4 pt-4 lg:py-8">
    <div class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold text-slate-100">Let's get you applying</h1>
      <p class="mt-1 text-slate-400">
        {{ steps[step - 1].hint }} — progress saves automatically.
      </p>
      <p v-if="saveState === 'saving'" class="mt-1 text-xs text-slate-500">Saving…</p>
      <p v-else-if="saveState === 'saved'" class="mt-1 text-xs text-teal-400">Progress saved</p>

      <div class="mt-6">
        <p class="text-sm font-medium text-slate-300">
          Step {{ step }} of {{ steps.length }} · {{ steps[step - 1].label }}
        </p>
        <div class="mt-3 flex gap-2">
          <div
            v-for="(_, i) in steps"
            :key="i"
            class="h-1 flex-1 rounded-full transition-colors"
            :class="step > i ? 'bg-teal-500' : 'bg-slate-800'"
          />
        </div>
      </div>

      <form class="card relative mt-6 space-y-4 p-6 pb-28 sm:pb-6" @submit.prevent="step < 3 ? goNext() : finish()">
        <!-- Step 1: Resume first -->
        <template v-if="step === 1">
          <h2 class="font-semibold text-slate-200">Upload your resume</h2>
          <p class="text-sm text-slate-500">
            PDF or Word from your phone or computer. We'll extract your skills, titles, and contact info.
          </p>
          <ResumeUpload
            v-model="form.resumeText"
            variant="hero"
            :apply-to-profile="true"
            :merge-skills="true"
            @parsed="onResumeParsed"
          />
          <details class="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <summary class="cursor-pointer text-sm text-slate-400">Or paste resume text</summary>
            <textarea
              v-model="form.resumeText"
              rows="5"
              class="input mt-3 text-sm"
              placeholder="Paste your resume here…"
              @blur="
                form.resumeText.trim().length >= 50 &&
                  profileStore.parseResume({ resumeText: form.resumeText, applyToProfile: true }).then(onResumeParsed)
              "
            />
          </details>
          <p v-if="resumeParsed && hasResume" class="text-sm text-teal-400">
            ✓ Resume loaded — tap Continue to review your profile.
          </p>
        </template>

        <!-- Step 2: Review auto-filled profile -->
        <template v-else-if="step === 2">
          <h2 class="font-semibold text-slate-200">Review your profile</h2>
          <p class="text-sm text-slate-500">We pulled this from your resume. Edit anything that looks off.</p>

          <div>
            <label class="mb-1 block text-sm text-slate-400">Name on applications</label>
            <input
              v-model="form.applicantName"
              required
              class="input"
              placeholder="Full name employers will see"
            />
          </div>
          <input
            v-model="form.headline"
            class="input"
            placeholder="Headline · e.g. Platform Engineer | AWS | Kubernetes"
          />
          <input v-model="form.linkedin" class="input" placeholder="LinkedIn URL" />
          <input v-model="form.github" class="input" placeholder="GitHub URL (optional)" />

          <div>
            <label class="mb-1 block text-sm text-slate-400">Target job titles (one per line)</label>
            <textarea v-model="form.targetTitles" rows="3" class="input font-mono text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Core skills</label>
            <textarea v-model="form.mustHaveSkills" rows="3" class="input font-mono text-sm" />
          </div>

          <ResumePreview
            :resume-text="form.resumeText"
            :score="profileStore.resumeScore"
            :skills="profileStore.extractedSkills"
          />
        </template>

        <!-- Step 3: Apply settings -->
        <template v-else>
          <h2 class="font-semibold text-slate-200">How you'll apply</h2>
          <p class="text-sm text-slate-400">Tailored resumes, email for applications, and matching strength.</p>

          <TailorApplySettings
            v-model:resume-mode="resumeMode"
            v-model:supplement-pages="supplementPages"
            v-model:tailor-mode="tailorMode"
            v-model:digest-email="digestEmail"
            v-model:contact-phone="contactPhone"
            v-model:applicant-name="form.applicantName"
            :resume-text="form.resumeText"
            :show-job-count="false"
          />
        </template>

        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>

        <div
          class="onboarding-actions safe-bottom fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-800 bg-slate-950/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2"
        >
          <button v-if="step > 1" type="button" class="btn-secondary" @click="step--">Back</button>
          <button type="submit" class="btn-primary btn-continue flex-1" :disabled="saving">
            <span>{{ step < 3 ? 'Continue' : saving ? 'Saving…' : 'Start applying' }}</span>
            <span v-if="step < 3 && !saving" class="ml-1" aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
