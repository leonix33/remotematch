const OpenAI = require('openai');
const env = require('../config/env');
const profileService = require('./profileService');
const jobService = require('./jobService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

function getClient() {
  if (!env.openaiApiKey) return null;
  return new OpenAI({ apiKey: env.openaiApiKey });
}

function profileBlock(profile) {
  return `Name: ${profile.displayName || 'Candidate'}
Target roles: ${(profile.targetTitles || []).join(', ')}
Must-have skills: ${(profile.mustHaveSkills || []).join(', ')}
Nice-to-have: ${(profile.niceToHaveSkills || []).join(', ')}
Resume highlights: ${(profile.resumeText || '').slice(0, 800)}`;
}

async function aiComplete(system, user, maxTokens = 500) {
  const client = getClient();
  if (!client) {
    return `[Demo mode — set OPENAI_API_KEY]\n\n${user.slice(0, 200)}... Analysis would appear here with live AI.`;
  }
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    max_tokens: maxTokens,
  });
  return response.choices[0]?.message?.content?.trim() || '';
}

async function findJob(jobId) {
  const jobs = jobService.readJobsFromSqlite(5000);
  return jobs.find((j) => j.jobId === jobId);
}

async function matchCopilot(userId, jobId) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const job = await findJob(jobId);
  if (!job) throw new Error('Job not found');

  const system = `You are Match Copilot. Analyze job fit. Respond in JSON only:
{"matchPct":number,"verdict":"strong|good|stretch|weak","strengths":["..."],"gaps":["..."],"talkingPoints":["..."],"oneLiner":"..."}`;
  const user = `PROFILE:\n${profileBlock(profile)}\n\nJOB:\nTitle: ${job.title}\nCompany: ${job.company}\nMatch: ${job.matchPct}%\nSource: ${job.source}\nATS: ${job.atsType}`;

  const raw = await aiComplete(system, user, 400);
  try {
    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    return { job, analysis: json, demo: !env.openaiApiKey };
  } catch {
    return {
      job,
      analysis: {
        matchPct: job.matchPct,
        verdict: job.matchPct >= 80 ? 'strong' : job.matchPct >= 65 ? 'good' : 'stretch',
        strengths: ['Cloud infrastructure', 'Automation'],
        gaps: ['Review job description for specifics'],
        talkingPoints: [raw.slice(0, 300)],
        oneLiner: raw.slice(0, 120),
      },
      demo: !env.openaiApiKey,
    };
  }
}

async function companyIntel(userId, company) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const system = `You are a company intelligence analyst for job seekers. Provide concise intel in markdown sections: Culture, Interview Style, Comp Bands (ranges), Remote Policy, Tips for ${profile.targetTitles?.[0] || 'tech'} candidates.`;
  const content = await aiComplete(system, `Company: ${company}`, 600);
  return { company, intel: content, demo: !env.openaiApiKey };
}

async function salaryOracle(userId, query) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const system = `You are a compensation advisor. Give US remote salary range (USD), equity note, and a 3-sentence negotiation script. Be realistic for 2025-2026.`;
  const user = `Query: ${query}\nCandidate context: ${profile.headline || profile.targetTitles?.[0] || 'engineer'}, skills: ${(profile.mustHaveSkills || []).slice(0, 5).join(', ')}`;
  const content = await aiComplete(system, user, 450);
  return { query, report: content, demo: !env.openaiApiKey };
}

async function resumeDiff(userId, jobId) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const job = await findJob(jobId);
  if (!job) throw new Error('Job not found');
  const system = `You are a resume coach. Suggest 5 specific bullet edits or additions for this job. Format as numbered list with before/after where helpful.`;
  const user = `RESUME CONTEXT:\n${profile.resumeText || profile.bio || 'No resume on file'}\n\nJOB: ${job.title} at ${job.company}`;
  const suggestions = await aiComplete(system, user, 550);
  return { job, suggestions, demo: !env.openaiApiKey };
}

async function agentWhisper(userId, limit = 10) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const minMatch = profile.minMatchScore || 60;
  const jobs = jobService.readJobsFromSqlite(200).filter((j) => (j.matchPct || 0) >= minMatch).slice(0, limit);

  const system = `For each job, write one-line approve/skip rationale (max 15 words). Return JSON array: [{"jobId":"...","rationale":"...","recommend":"approve|skip|review"}]`;
  const user = `Profile skills: ${(profile.mustHaveSkills || []).join(', ')}\nJobs:\n${jobs.map((j) => `${j.jobId}|${j.title}|${j.company}|${j.matchPct}%`).join('\n')}`;

  const raw = await aiComplete(system, user, 500);
  try {
    const items = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
    return jobs.map((j) => {
      const w = items.find((i) => i.jobId === j.jobId) || {};
      return { ...j, rationale: w.rationale || 'Review manually', recommend: w.recommend || 'review' };
    });
  } catch {
    return jobs.map((j) => ({
      ...j,
      rationale: j.matchPct >= 80 ? 'Strong skill overlap' : 'Worth a look',
      recommend: j.matchPct >= 75 ? 'approve' : 'review',
    }));
  }
}

async function voiceApplyParse(userId, transcript) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const jobs = jobService.readJobsFromSqlite(100).filter((j) => (j.matchPct || 0) >= (profile.minMatchScore || 60));
  const system = `Parse voice command for job apply. Return JSON: {"action":"queue_top|queue_company|search","count":number,"company":"","jobIds":[]}`;
  const user = `Transcript: "${transcript}"\nTop jobs:\n${jobs.slice(0, 15).map((j) => `${j.jobId}|${j.title}|${j.company}`).join('\n')}`;
  const raw = await aiComplete(system, user, 200);
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return { action: 'queue_top', count: 3, company: '', jobIds: jobs.slice(0, 3).map((j) => j.jobId) };
  }
}

async function companyScan(userId, companyName) {
  requireMongo();
  const jobs = jobService.readJobsFromSqlite(5000).filter(
    (j) => j.company?.toLowerCase().includes(companyName.toLowerCase())
  );
  const profile = await profileService.getOrCreate(userId);
  return {
    company: companyName,
    jobs: jobs.slice(0, 20),
    count: jobs.length,
    topMatch: jobs[0] || null,
    profileFit: jobs.length ? `Found ${jobs.length} roles; best match ${jobs[0]?.matchPct || 0}%` : 'No open roles in feed',
  };
}

module.exports = {
  matchCopilot,
  companyIntel,
  salaryOracle,
  resumeDiff,
  agentWhisper,
  voiceApplyParse,
  companyScan,
};
