import { defineStore } from 'pinia';
import http from '../api/http';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    loaded: false,
  }),
  getters: {
    complete: (s) => Boolean(s.profile?.complete),
    completionPct: (s) => {
      const p = s.profile;
      if (!p) return 0;
      const checks = [
        Boolean(p.displayName?.trim()),
        Boolean(p.targetTitles?.length),
        Boolean(p.mustHaveSkills?.length),
        Boolean((p.resumeText || '').trim().length >= 50),
        Boolean(p.headline?.trim()),
        Boolean(p.niceToHaveSkills?.length || p.targetCompanies?.length),
        Boolean(p.linkedin?.trim() || p.github?.trim() || p.portfolio?.trim()),
        Boolean(p.onboardingComplete),
      ];
      return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    },
    resumeScore: (s) => s.profile?.resumeScore ?? 0,
    extractedSkills: (s) => s.profile?.extractedSkills || [],
  },
  actions: {
    async fetch() {
      const { data } = await http.get('/profile/me');
      this.profile = data;
      this.loaded = true;
      return data;
    },
    async save(payload) {
      const { data } = await http.patch('/profile/me', payload);
      this.profile = data;
      this.loaded = true;
      return data;
    },
    async parseResume({ fileBase64, filename, applyToProfile = false, mergeSkills = true }) {
      const { data } = await http.post('/profile/resume/parse', {
        fileBase64,
        filename,
        applyToProfile,
        mergeSkills,
      });
      if (data.profile) {
        this.profile = data.profile;
        this.loaded = true;
      }
      return data;
    },
    reset() {
      this.profile = null;
      this.loaded = false;
    },
    async toggleSavedJob(job) {
      const saved = [...(this.profile?.savedJobs || [])];
      const idx = saved.findIndex((s) => s.jobId === job.jobId);
      if (idx >= 0) {
        saved.splice(idx, 1);
      } else {
        saved.unshift({
          jobId: job.jobId,
          title: job.title,
          company: job.company,
          url: job.url,
          matchPct: job.personalMatchPct ?? job.matchPct ?? 0,
          savedAt: new Date().toISOString(),
        });
      }
      return this.save({ savedJobs: saved });
    },
    isJobSaved(jobId) {
      return Boolean(this.profile?.savedJobs?.some((s) => s.jobId === jobId));
    },
  },
});
