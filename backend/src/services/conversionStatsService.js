const jobService = require('./jobService');
const localApplicationService = require('./localApplicationService');
const localOutcomeStore = require('./localOutcomeStore');

const POSITIVE_STAGES = new Set(['screen', 'onsite', 'offer']);
const DEFAULT_REPLY_RATE = 0.06;

function normalizeSource(source = '') {
  return String(source || 'unknown').trim().toLowerCase() || 'unknown';
}

function buildSourceStatsFromApplications(applications) {
  const bySource = {};
  for (const app of applications) {
    const key = normalizeSource(app.source);
    if (!bySource[key]) bySource[key] = { total: 0, submitted: 0, positive: 0 };
    bySource[key].total += 1;
    if (app.status === 'submitted') bySource[key].submitted += 1;
  }
  return bySource;
}

function buildSourceStatsFromOutcomes(outcomes) {
  const bySource = {};
  for (const o of outcomes) {
    const key = normalizeSource(o.source);
    if (!bySource[key]) bySource[key] = { total: 0, replies: 0 };
    bySource[key].total += 1;
    if (POSITIVE_STAGES.has(o.stage)) bySource[key].replies += 1;
  }
  return bySource;
}

function rate(replies, total, fallback = DEFAULT_REPLY_RATE) {
  if (!total || total < 2) return fallback;
  return Math.min(0.45, Math.max(0.02, replies / total));
}

function getConversionContext(userId) {
  const applications = localApplicationService.listForUser(userId);
  const outcomes = localOutcomeStore.list(userId);
  const appBySource = buildSourceStatsFromApplications(applications);
  const outcomeBySource = buildSourceStatsFromOutcomes(outcomes);

  const sourceReplyRates = {};
  const keys = new Set([...Object.keys(appBySource), ...Object.keys(outcomeBySource)]);
  for (const key of keys) {
    const app = appBySource[key] || { total: 0, submitted: 0 };
    const out = outcomeBySource[key] || { total: 0, replies: 0 };
    const replies = out.replies + app.submitted * 0.15;
    const total = Math.max(app.total, out.total);
    sourceReplyRates[key] = rate(replies, total);
  }

  const allOutcomes = outcomes.length;
  const positiveOutcomes = outcomes.filter((o) => POSITIVE_STAGES.has(o.stage)).length;
  const userReplyRate = rate(positiveOutcomes, allOutcomes, DEFAULT_REPLY_RATE);

  return {
    sourceReplyRates,
    userReplyRate,
    defaultReplyRate: DEFAULT_REPLY_RATE,
    sampleSize: applications.length + outcomes.length,
  };
}

function companyJobCounts(jobs) {
  const counts = {};
  for (const job of jobs) {
    const c = normalizeSource(job.company);
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

module.exports = {
  getConversionContext,
  companyJobCounts,
  DEFAULT_REPLY_RATE,
};
