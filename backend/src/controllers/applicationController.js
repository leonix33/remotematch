const applicationService = require('../services/applicationService');
const env = require('../config/env');

async function listApplications(req, res, next) {
  try {
    const apps = await applicationService.listForUser(req.user.sub, {
      status: req.query.status || '',
      limit: req.query.limit || 500,
      offset: req.query.offset || 0,
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
}

async function myActivity(req, res, next) {
  try {
    const activity = await applicationService.activityForUser(req.user.sub);
    res.json(activity);
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
      await applicationService.upsertForUser(req.user.sub, app.jobId, app);
      imported += 1;
    }
    res.json({ imported });
  } catch (err) {
    next(err);
  }
}

module.exports = { listApplications, myActivity, importApplications };
