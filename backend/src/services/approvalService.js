const JobApproval = require('../models/JobApproval');
const Job = require('../models/Job');
const env = require('../config/env');
const jobService = require('./jobService');
const profileService = require('./profileService');
const { scoreJobsForProfile } = require('./jobScoringService');

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
  jobs = scoreJobsForProfile(jobs, profile).filter((j) => j.personalMatchPct >= minMatch);

  if (!env.mongoUri) {
    return jobs
      .filter((j) => (statusFilter === 'all' ? true : statusFilter === 'pending'))
      .map((j) => ({ ...j, status: 'pending' }));
  }

  const approvals = await JobApproval.find({ userId }).lean();
  const byJob = new Map(approvals.map((a) => [a.jobId, a]));

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
    throw new Error('MongoDB is required for apply approvals');
  }
  const jobs = await loadJobs(0);
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) throw new Error('Job not found');

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

module.exports = { listForUser, setStatus, counts, listApproved, markApplied };
