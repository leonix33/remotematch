const Job = require('../models/Job');
const Application = require('../models/Application');
const Generation = require('../models/Generation');
const AgentRun = require('../models/AgentRun');
const jobService = require('./jobService');
const applicationService = require('./applicationService');
const env = require('../config/env');

async function summary(userId = null) {
  let jobs = [];
  let applications = [];
  let generations = 0;
  let agentRuns = 0;

  if (env.mongoUri) {
    jobs = await Job.find().lean();
    if (userId) {
      applications = await Application.find({ userId }).lean();
      generations = await Generation.countDocuments({ createdBy: userId });
      agentRuns = await AgentRun.countDocuments({ startedBy: userId });
    } else {
      applications = await Application.find().lean();
      generations = await Generation.countDocuments();
      agentRuns = await AgentRun.countDocuments();
    }
  } else {
    jobs = jobService.readJobsFromSqlite();
    applications = userId
      ? await applicationService.listForUser(userId, { limit: 5000 })
      : jobService.readApplicationsFromSqlite();
  }

  const bySection = jobs.reduce((acc, job) => {
    const key = job.emailSection || 'manual_browse';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byStatus = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const byJobBoard = jobs.reduce((acc, job) => {
    const key = job.source || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byApplicationSource = applications.reduce((acc, app) => {
    const key = app.source || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    appName: env.appName,
    totalJobs: jobs.length,
    applyToday: bySection.apply_today || 0,
    strongReview: bySection.strong_review || 0,
    manualBrowse: bySection.manual_browse || 0,
    highMatch: jobs.filter((j) => (j.matchPct || 0) >= 80).length,
    totalApplications: applications.length,
    submitted: applications.filter((a) => a.status === 'submitted').length,
    botBlocked: applications.filter((a) => a.status === 'bot-blocked').length,
    manualReview: applications.filter((a) => a.status === 'manual-review').length,
    generations,
    agentRuns,
    bySection,
    byStatus,
    byJobBoard,
    byApplicationSource,
  };
}

module.exports = { summary };
