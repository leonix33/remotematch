const openaiService = require('./openaiService');
const profileService = require('./profileService');
const approvalService = require('./approvalService');
const analyticsService = require('./analyticsService');
const jobService = require('./jobService');
const env = require('../config/env');

const APP_ROUTES = [
  { path: '/', label: 'Home dashboard', for: 'overview, recommended jobs, resume score' },
  { path: '/jobs', label: 'Jobs', for: 'browse and search all matched jobs' },
  { path: '/approvals', label: 'Apply Queue', for: 'review, approve, or skip queued jobs' },
  { path: '/tailored-resumes', label: 'Tailored resumes', for: 'application kits and supplements' },
  { path: '/applications', label: 'Applications', for: 'track apply status and outcomes' },
  { path: '/follow-ups', label: 'Follow-ups', for: 'traction trace and digest' },
  { path: '/linkedin', label: 'LinkedIn workflow', for: 'saved searches and extension' },
  { path: '/monitor', label: 'Monitor', for: 'pipeline, agent runs, system health' },
  { path: '/chat', label: 'Connect', for: 'AI coach and team chat' },
  { path: '/intelligence', label: 'AI Intel', for: 'match copilot, company intel, voice apply' },
  { path: '/interview', label: 'Interview', for: 'mock interviews' },
  { path: '/generator', label: 'Cover letter', for: 'generate cover letters' },
  { path: '/calendar', label: 'Calendar', for: 'upcoming follow-ups and events' },
  { path: '/profile', label: 'Profile', for: 'resume, skills, OpenAI key, email settings' },
];

const SYSTEM = `You are remotelymatch Concierge — the in-app guide for a quality-first remote job search platform (NOT a spam apply bot).

You have LIVE access to the user's profile, queue, jobs, and application stats in the context JSON.
Help them FIND things in the app, understand their pipeline, and take the next best action.

RULES:
1. Be concise, warm, and professional (2-4 sentences unless they ask for detail).
2. Ground answers in the provided snapshot — never invent job counts or companies not in context.
3. When they want to go somewhere, include a navigate action with the exact path from APP_ROUTES.
4. Prefer interviews-over-volume: approve high-match roles, tailor thoughtfully, don't spray applications.
5. If they ask to do something the app cannot do from chat, explain the manual steps and offer navigation.

Respond with JSON only:
{
  "reply": "markdown-safe plain text for the user",
  "actions": [{"type":"navigate","path":"/approvals","label":"Open Apply Queue"}],
  "highlights": ["optional bullet facts you cited"]
}

APP_ROUTES:
${JSON.stringify(APP_ROUTES, null, 0)}`;

async function buildSnapshot(userId) {
  const [profile, queueCounts, analytics, queueList] = await Promise.all([
    profileService.getOrCreate(userId),
    approvalService.counts(userId).catch(() => ({ pending: 0, approved: 0, rejected: 0 })),
    analyticsService.summary(userId).catch(() => null),
    approvalService.listForUser(userId, { status: 'pending', limit: 8, sort: 'match' }).catch(() => ({ items: [] })),
  ]);

  const allJobs = jobService.readJobsFromSqlite(200);
  const minMatch = profile.minMatchScore || 60;
  const highMatchJobs = allJobs
    .filter((j) => (j.matchPct || 0) >= Math.max(minMatch, 80))
    .slice(0, 6)
    .map((j) => ({
      jobId: j.jobId,
      title: j.title,
      company: j.company,
      matchPct: j.matchPct,
      source: j.source,
    }));

  return {
    user: {
      name: profile.displayName || 'User',
      headline: profile.headline || '',
      targetTitles: (profile.targetTitles || []).slice(0, 4),
      topSkills: (profile.mustHaveSkills || []).slice(0, 8),
      minMatchScore: minMatch,
      tailorOnApprove: Boolean(profile.tailorResumeOnApply),
      openaiConnected: Boolean(profile.openaiConnected),
    },
    queue: queueCounts,
    pipeline: analytics
      ? {
          totalJobs: analytics.totalJobs,
          totalApplications: analytics.totalApplications,
          submitted: analytics.submitted,
          highMatchInDb: analytics.highMatch,
        }
      : null,
    pendingQueue: (queueList.items || []).map((j) => ({
      jobId: j.jobId,
      title: j.title,
      company: j.company,
      matchPct: j.personalMatchPct || j.matchPct,
      status: j.status,
      source: j.source,
    })),
    highMatchJobs,
    appName: env.appName,
  };
}

function parseResponse(raw) {
  const cleaned = String(raw || '')
    .replace(/```json\n?|\n?```/g, '')
    .trim();
  try {
    const json = JSON.parse(cleaned);
    return {
      reply: json.reply || 'Here is what I found.',
      actions: Array.isArray(json.actions) ? json.actions.filter((a) => a.type === 'navigate' && a.path) : [],
      highlights: Array.isArray(json.highlights) ? json.highlights : [],
    };
  } catch {
    return {
      reply: raw || 'I could not parse that. Try asking about your queue, applications, or where to find a feature.',
      actions: [],
      highlights: [],
    };
  }
}

async function ask(userId, message, history = []) {
  const snapshot = await buildSnapshot(userId);
  const live = await openaiService.isLive(userId);

  const userBlock = `USER MESSAGE: ${message}

LIVE SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}`;

  const messages = [
    { role: 'system', content: SYSTEM },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userBlock },
  ];

  if (!live) {
    const q = snapshot.queue;
    return {
      reply: `[Demo mode — connect OpenAI in Profile for full concierge]\n\nYou have ${q.pending} jobs pending review, ${q.approved} approved, and ${snapshot.pendingQueue.length ? `your top queue item is ${snapshot.pendingQueue[0].title} at ${snapshot.pendingQueue[0].company}` : 'an empty queue'}. Open Apply Queue to triage, or Jobs to discover new roles.`,
      actions: q.pending > 0 ? [{ type: 'navigate', path: '/approvals', label: 'Open Apply Queue' }] : [{ type: 'navigate', path: '/jobs', label: 'Browse jobs' }],
      highlights: [`${q.pending} pending`, `${q.approved} approved`],
      demo: true,
      snapshot,
    };
  }

  const raw = await openaiService.chatCompletion(userId, {
    messages,
    temperature: 0.5,
    max_tokens: 700,
  });

  const parsed = parseResponse(raw);
  return {
    ...parsed,
    demo: false,
    snapshot: {
      queue: snapshot.queue,
      pipeline: snapshot.pipeline,
    },
  };
}

module.exports = { ask, buildSnapshot, APP_ROUTES };
