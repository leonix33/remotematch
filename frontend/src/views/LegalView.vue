<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { brand } from '../brand';

const route = useRoute();
const isPrivacy = computed(() => route.path === '/privacy');
const updated = 'June 21, 2026';
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 safe-top safe-bottom">
    <h1 class="text-3xl font-bold text-slate-100">
      {{ isPrivacy ? 'Privacy Policy' : 'Terms of Use' }}
    </h1>
    <p class="mt-2 text-sm text-slate-500">Last updated: {{ updated }}</p>

    <div v-if="isPrivacy" class="prose prose-invert mt-8 max-w-none space-y-6 text-slate-300">
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Overview</h2>
        <p class="mt-2 text-sm leading-relaxed">
          {{ brand.name }} ("we", "us") helps job seekers find remote roles, manage an apply queue, track
          applications, and generate tailored application content. This policy explains what we collect and how we use it.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Information we collect</h2>
        <ul class="mt-2 list-disc space-y-2 pl-5 text-sm">
          <li>Account information: name, email, password (stored hashed)</li>
          <li>Profile data: headline, skills, target roles, resume text, professional links</li>
          <li>Job activity: saved jobs, apply queue decisions, application status</li>
          <li>Calendar events you create for interviews and follow-ups</li>
          <li>Resume files you upload (parsed to extract text and skills)</li>
          <li>Push notification subscription data if you opt in</li>
        </ul>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">How we use your data</h2>
        <ul class="mt-2 list-disc space-y-2 pl-5 text-sm">
          <li>Score and recommend jobs matched to your profile</li>
          <li>Generate cover letters and resume suggestions when you request them</li>
          <li>Run your approved apply queue and track submission status</li>
          <li>Send optional reminders for matches, messages, and calendar events</li>
        </ul>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Data sharing</h2>
        <p class="mt-2 text-sm leading-relaxed">
          We do not sell your personal data. We use infrastructure providers (hosting, email, AI APIs) only to
          operate the service. Job listings may link to third-party employer sites with their own policies.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Your choices</h2>
        <p class="mt-2 text-sm leading-relaxed">
          You can export or delete your account from Profile settings. Resume uploads are limited to 8 MB.
          Push notifications and calendar reminders are optional and require your permission.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Contact</h2>
        <p class="mt-2 text-sm">
          Questions: <a class="text-teal-400 hover:underline" :href="`mailto:${brand.supportEmail}`">{{ brand.supportEmail }}</a>
        </p>
      </section>
    </div>

    <div v-else class="prose prose-invert mt-8 max-w-none space-y-6 text-slate-300">
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Agreement</h2>
        <p class="mt-2 text-sm leading-relaxed">
          By using {{ brand.name }}, you agree to these terms. If you do not agree, do not use the service.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Service description</h2>
        <p class="mt-2 text-sm leading-relaxed">
          {{ brand.name }} provides job discovery, matching, an approval-based apply queue, application tracking,
          and AI-assisted content tools. We do not guarantee interviews, offers, or application outcomes.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Your responsibilities</h2>
        <ul class="mt-2 list-disc space-y-2 pl-5 text-sm">
          <li>Provide accurate profile and resume information</li>
          <li>Review jobs before approving auto-apply actions</li>
          <li>Comply with employer and job board terms when applying</li>
          <li>Keep your login credentials secure</li>
        </ul>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">AI-generated content</h2>
        <p class="mt-2 text-sm leading-relaxed">
          Cover letters and resume suggestions are assistive drafts. You are responsible for reviewing and submitting
          accurate application materials.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Account termination</h2>
        <p class="mt-2 text-sm leading-relaxed">
          You may delete your account at any time from Profile settings. We may suspend accounts that abuse the
          service or violate these terms.
        </p>
      </section>
      <section>
        <h2 class="text-xl font-semibold text-slate-100">Contact</h2>
        <p class="mt-2 text-sm">
          <a class="text-teal-400 hover:underline" :href="`mailto:${brand.supportEmail}`">{{ brand.supportEmail }}</a>
        </p>
      </section>
    </div>

    <p class="mt-10 text-sm text-slate-500">
      <router-link to="/login" class="text-teal-400 hover:underline">← Back to login</router-link>
    </p>
  </div>
</template>
