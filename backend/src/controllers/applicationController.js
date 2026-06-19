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

async function importApplications(req, res, next) {
  try {
    if (!env.mongoUri) {
      return res.status(400).json({ message: 'MongoDB is required for import' });
    }
    const applications = req.body.applications;
    if (!Array.isArray(applications) || !applications.length) {
      return res.status(400).json({ message: 'applications array is required' });
    }
    let imported = 0;
    for (const app of applications) {
      if (!app.jobId) continue;
      await Application.findOneAndUpdate({ jobId: app.jobId }, app, { upsert: true, new: true });
      imported += 1;
    }
    res.json({ imported });
  } catch (err) {
    next(err);
  }
}

module.exports = { listApplications, importApplications };
