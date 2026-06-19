const env = require('../config/env');
const jobService = require('../services/jobService');
const Job = require('../models/Job');
const Application = require('../models/Application');

async function status(req, res, next) {
  try {
    const sqliteJobs = jobService.readJobsFromSqlite(10000).length;
    const sqliteApps = jobService.readApplicationsFromSqlite(10000).length;

    let mongoJobs = 0;
    let mongoApps = 0;
    if (env.mongoUri) {
      mongoJobs = await Job.countDocuments();
      mongoApps = await Application.countDocuments();
    }

    res.json({
      source: env.mongoUri ? 'mongodb' : 'sqlite',
      agentHome: env.agentHome,
      sqliteJobs,
      sqliteApps,
      mongoJobs,
      mongoApps,
      inSync: env.mongoUri ? sqliteJobs === mongoJobs && sqliteApps === mongoApps : true,
    });
  } catch (err) {
    next(err);
  }
}

async function syncAll(req, res, next) {
  try {
    if (!env.mongoUri) {
      return res.json({
        message: 'SQLite-only mode — data is already read directly from agent databases',
        jobs: jobService.readJobsFromSqlite(10000).length,
        applications: jobService.readApplicationsFromSqlite(10000).length,
      });
    }
    const jobs = await jobService.syncJobsToMongo();
    const applications = await jobService.syncApplicationsToMongo();
    res.json({ jobs, applications, message: 'Sync complete' });
  } catch (err) {
    next(err);
  }
}

module.exports = { status, syncAll };
