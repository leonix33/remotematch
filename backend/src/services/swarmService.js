const SwarmRun = require('../models/SwarmRun');
const env = require('../config/env');
const jobService = require('./jobService');
const profileService = require('./profileService');
const intelligenceService = require('./intelligenceService');
const approvalService = require('./approvalService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(userId) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const minMatch = profile.minMatchScore || 60;
  const jobs = jobService.readJobsFromSqlite(100).filter((j) => (j.matchPct || 0) >= minMatch).slice(0, 5);

  const swarm = await SwarmRun.create({
    userId,
    status: 'running',
    jobIds: jobs.map((j) => j.jobId),
    stages: {
      scout: { status: 'running', result: '' },
      writer: { status: 'pending', result: '' },
      reviewer: { status: 'pending', result: '' },
    },
  });

  swarm.stages.scout = {
    status: 'complete',
    result: `Scout found ${jobs.length} high-match roles: ${jobs.map((j) => j.company).join(', ')}`,
    completedAt: new Date(),
  };
  swarm.stages.writer = { status: 'running', result: '' };
  await swarm.save();

  const drafts = [];
  for (const job of jobs.slice(0, 3)) {
    try {
      const { analysis } = await intelligenceService.matchCopilot(userId, job.jobId);
      drafts.push(`${job.company}: ${analysis?.oneLiner || 'Draft ready'}`);
      await delay(200);
    } catch {
      drafts.push(`${job.company}: Cover letter draft queued`);
    }
  }

  swarm.stages.writer = {
    status: 'complete',
    result: `Writer drafted ${drafts.length} applications:\n${drafts.join('\n')}`,
    completedAt: new Date(),
  };
  swarm.stages.reviewer = { status: 'running', result: '' };
  await swarm.save();

  const whisper = await intelligenceService.agentWhisper(userId, 5);
  const approved = whisper.filter((w) => w.recommend === 'approve').length;
  swarm.stages.reviewer = {
    status: 'complete',
    result: `Reviewer recommends ${approved} for approval queue. ${whisper.map((w) => `${w.company}: ${w.rationale}`).join(' | ')}`,
    completedAt: new Date(),
  };

  for (const w of whisper.filter((x) => x.recommend === 'approve').slice(0, 3)) {
    try {
      await approvalService.setStatus(userId, w.jobId, 'approved', `Swarm auto-review: ${w.rationale}`);
    } catch {
      /* skip */
    }
  }

  swarm.status = 'complete';
  swarm.summary = `Swarm complete: ${jobs.length} scouted, ${drafts.length} drafted, ${approved} queued for approval`;
  await swarm.save();
  return swarm;
}

async function list(userId) {
  requireMongo();
  return SwarmRun.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
}

module.exports = { run, list };
