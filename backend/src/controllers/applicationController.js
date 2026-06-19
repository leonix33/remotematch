const Application = require('../models/Application');
const jobService = require('../services/jobService');
const env = require('../config/env');

async function listApplications(req, res, next) {
  try {
    let apps;
    if (env.mongoUri) {
      apps = await Application.find().sort({ lastAttempted: -1 }).limit(200).lean();
    } else {
      apps = jobService.readApplicationsFromSqlite();
    }
    if (req.query.status) {
      apps = apps.filter((a) => a.status === req.query.status);
    }
    res.json(apps);
  } catch (err) {
    next(err);
  }
}

module.exports = { listApplications };
