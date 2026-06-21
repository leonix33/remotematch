const crypto = require('crypto');
const JobApproval = require('../models/JobApproval');
const Job = require('../models/Job');
const env = require('../config/env');
const jobService = require('./jobService');
const profileService = require('./profileService');
const { scoreJobsForProfile } = require('./jobScoringService');
const teamService = require('./teamService');
const externalQueueService = require('./externalQueueService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function loadJobs(minMatch = 60) {
  if (env.mongoUri) {
    return Job.find({ matchPct: { $gte: minMatch } })
      .sort({ matchPct: -1 })
      .limit(500)
      .lean();
  }
  return jobService.readJobsFromSqlite(5000).filter(
    (j) => (j.matchPct || 0) >= minMatch && j.emailSection !== 'manual_browse'
  );
}

async function listForUser(userId, statusFilter = 'pending') {
  const profile = await profileService.getOrCreate(userId);
  const minMatch = profile.minMatchScore || 60;
  let jobs = await loadJobs(minMatch);

  const profileEmpty = !(profile?.targetTitles?.length || profile?.mustHaveSkills?.length);
  if (profileEmpty) {
    jobs = jobs
      .filter((j) => (j.matchPct || 0) >= minMatch)
      .map((j) => ({
        ...j,
        personalMatchPct: j.matchPct || 0,
        matchPct: j.matchPct || 0,
      }));
  } else {
    jobs = scoreJobsForProfile(jobs, profile).filter((j) => j.personalMatchPct >= minMatch);
  }

  if (!env.mongoUri) {
    const external = externalQueueService.listForUser(userId);
    const sqliteJobs = jobs
      .filter((j) => (statusFilter === 'all' ? true : statusFilter === 'pending'))
      .map((j) => ({ ...j, status: 'pending' }));
    const externalRows = external
      .filter((e) => statusFilter === 'all' || e.status === statusFilter)
      .map((e) => ({
        jobId: e.jobId,
        title: e.title,
        company: e.company,
        url: e.url,
        matchPct: e.matchPct || 0,
        source: e.source || 'chrome-extension',
        status: e.status || 'pending',
        notes: e.notes || '',
        personalMatchPct: e.matchPct || 0,
      }));
    return [...externalRows, ...sqliteJobs];
  }

  const approvals = await JobApproval.find({ userId }).lean();
  const byJob = new Map(approvals.map((a) => [a.jobId, a]));

  const jobIdsInFeed = new Set(jobs.map((j) => j.jobId));
  for (const a of approvals) {
    if (!jobIdsInFeed.has(a.jobId) && a.jobId.startsWith('ext-')) {
      jobs.push({
        jobId: a.jobId,
        title: a.title,
        company: a.company,
        url: a.url,
        matchPct: a.matchPct || 0,
        atsType: a.atsType,
        source: a.source || 'chrome-extension',
        personalMatchPct: a.matchPct || 0,
      });
    }
  }

  const merged = jobs.map((job) => {
    const existing = byJob.get(job.jobId);
    return {
      jobId: job.jobId,
      title: job.title,
      company: job.company,
      url: job.url,
      matchPct: job.matchPct,
      atsType: job.atsType,
      source: job.source,
      emailSection: job.emailSection,
      status: existing?.status || 'pending',
      notes: existing?.notes || '',
      reviewedAt: existing?.reviewedAt,
      _id: existing?._id,
    };
  });

  if (statusFilter === 'all') return merged;
  return merged.filter((j) => j.status === statusFilter);
}

async function setStatus(userId, jobId, status, notes = '') {
  if (!env.mongoUri) {
    const ext = externalQueueService.find(userId, jobId);
    if (ext || jobId.startsWith('ext-')) {
      const row = externalQueueService.upsert(userId, {
        ...ext,
        jobId,
        status,
        notes,
        title: ext?.title || 'External job',
        company: ext?.company || 'Unknown',
        url: ext?.url || '',
        source: ext?.source || 'chrome-extension',
      });
      return row;
    }
    throw new Error('MongoDB is required for apply approvals on agent jobs');
  }
  if (status === 'approved') {
    await teamService.checkLimit(userId, 'approval');
  }

  let job = (await loadJobs(0)).find((j) => j.jobId === jobId);
  if (!job) {
    const existing = await JobApproval.findOne({ userId, jobId });
    if (!existing) throw new Error('Job not found');
    job = {
      jobId: existing.jobId,
      title: existing.title,
      company: existing.company,
      url: existing.url,
      matchPct: existing.matchPct,
      atsType: existing.atsType,
      source: existing.source,
    };
  }

  const approval = await JobApproval.findOneAndUpdate(
    { userId, jobId },
    {
      userId,
      jobId,
      title: job.title,
      company: job.company,
      url: job.url,
      matchPct: job.matchPct,
      atsType: job.atsType,
      source: job.source,
      status,
      notes,
      reviewedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  if (status === 'approved') {
    await teamService.incrementUsage(userId, 'approval');
  }
  return approval;
}

async function counts(userId) {
  const items = await listForUser(userId, 'all');
  return {
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  };
}

async function listApproved(userId) {
  requireMongo();
  const approvals = await JobApproval.find({ userId, status: 'approved' }).lean();
  const allJobs = jobService.readJobsFromSqlite(5000);
  const jobMap = new Map(allJobs.map((j) => [j.jobId, j]));
  return approvals.map((a) => {
    const job = jobMap.get(a.jobId) || {
      jobId: a.jobId,
      title: a.title,
      company: a.company,
      url: a.url,
      matchPct: a.matchPct,
      atsType: a.atsType,
      source: a.source,
      tier: 'SECONDARY',
      score: 50,
      location: 'Remote',
      emailSection: 'strong_review',
    };
    return { ...job, approvalId: a._id, notes: a.notes };
  });
}

async function markApplied(userId, jobIds) {
  requireMongo();
  await JobApproval.updateMany(
    { userId, jobId: { $in: jobIds }, status: 'approved' },
    { status: 'applied', reviewedAt: new Date() }
  );
}

async function addExternal(userId, { url, title, company }) {
  if (!url) throw new Error('URL is required');
  const jobId = `ext-${crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)}`;
  const row = {
    userId,
    jobId,
    title: title || 'External job',
    company: company || 'Unknown',
    url,
    matchPct: 0,
    source: 'chrome-extension',
    status: 'pending',
    notes: 'Queued from browser extension',
  };

  if (env.mongoUri) {
    return JobApproval.findOneAndUpdate({ userId, jobId }, row, { upsert: true, new: true });
  }

  return externalQueueService.upsert(userId, row);
}

module.exports = { listForUser, setStatus, counts, listApproved, markApplied, addExternal };
