<script setup>
import { RouterLink } from 'vue-router';
import AppLogo from '../components/AppLogo.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-200">
    <header class="safe-top mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <AppLogo size="md" />
      <RouterLink to="/login" class="btn-primary">Sign in</RouterLink>
    </header>

    <main class="mx-auto max-w-6xl px-6 pb-20">
      <section class="mt-12 text-center lg:mt-20">
        <p class="text-sm font-medium uppercase tracking-widest text-teal-400">Match-first remote hiring</p>
        <h1 class="mt-4 text-4xl font-bold leading-tight text-slate-50 md:text-6xl">
          Find roles. Review matches.<br />Apply as a squad.
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          RemoteMatch combines your job agent, AI coaching, approval queue, and team chat —
          so you only auto-apply to roles you've actually approved.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <RouterLink to="/login" class="btn-primary px-8 py-3 text-base">Get started</RouterLink>
          <a href="#features" class="btn-secondary px-8 py-3 text-base">See how it works</a>
        </div>
      </section>

      <section id="features" class="mt-24 grid gap-6 md:grid-cols-3">
        <div class="card p-6">
          <p class="text-2xl">🎯</p>
          <h3 class="mt-3 font-semibold text-teal-200">Personal match scores</h3>
          <p class="mt-2 text-sm text-slate-400">Jobs re-ranked to your skills, titles, and targets — not a generic feed.</p>
        </div>
        <div class="card p-6">
          <p class="text-2xl">✓</p>
          <h3 class="mt-3 font-semibold text-teal-200">Approval queue</h3>
          <p class="mt-2 text-sm text-slate-400">Review high-match roles. Agent only applies what you approve.</p>
        </div>
        <div class="card p-6">
          <p class="text-2xl">🤝</p>
          <h3 class="mt-3 font-semibold text-teal-200">Apply squads</h3>
          <p class="mt-2 text-sm text-slate-400">Coordinate with teammates, share resumes, prep interviews together.</p>
        </div>
        <div class="card p-6">
          <p class="text-2xl">🧠</p>
          <h3 class="mt-3 font-semibold text-teal-200">AI intelligence</h3>
          <p class="mt-2 text-sm text-slate-400">Match copilot, interview simulator, salary oracle, market pulse.</p>
        </div>
        <div class="card p-6">
          <p class="text-2xl">📄</p>
          <h3 class="mt-3 font-semibold text-teal-200">Community resumes</h3>
          <p class="mt-2 text-sm text-slate-400">Browse real samples from your squad. Upload PDF or share text.</p>
        </div>
        <div class="card p-6">
          <p class="text-2xl">📆</p>
          <h3 class="mt-3 font-semibold text-teal-200">Calendar + events</h3>
          <p class="mt-2 text-sm text-slate-400">Interviews, deadlines, and US remote/in-person job conferences.</p>
        </div>
      </section>

      <section class="mt-24 card p-8 text-center md:p-12">
        <h2 class="text-2xl font-bold text-slate-100">Invite-only for your team</h2>
        <p class="mx-auto mt-3 max-w-xl text-slate-400">
          Admin invites users. No public signup noise — built for serious remote job seekers in DevOps, SRE, cloud, and platform engineering.
        </p>
        <RouterLink to="/login" class="btn-primary mt-8 inline-block">Sign in to RemoteMatch</RouterLink>
      </section>
    </main>

    <footer class="border-t border-slate-800 py-8 text-center text-sm text-slate-600">
      RemoteMatch · remotematch.onrender.com
    </footer>
  </div>
</template>
