const Job = require('../models/Job');
const jobService = require('../services/jobService');
const env = require('../config/env');

async function listJobs(req, res, next) {
  try {
    const { section = 'all', minMatch = '0', search = '' } = req.query;
    let jobs;
    if (env.mongoUri) {
      const query = {};
      if (section !== 'all') query.emailSection = section;
      if (Number(minMatch) > 0) query.matchPct = { $gte: Number(minMatch) };
      jobs = await Job.find(query).sort({ matchPct: -1, score: -1 }).limit(200).lean();
      if (search) {
        const needle = search.toLowerCase();
        jobs = jobs.filter((j) =>
          [j.title, j.company, j.location, j.source].join(' ').toLowerCase().includes(needle)
        );
      }
    } else {
      jobs = jobService.listJobsFromSqlite({ section, minMatch, search });
    }
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function syncJobs(req, res, next) {
  try {
    const count = await jobService.syncJobsToMongo();
    res.json({ synced: count });
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, syncJobs };
