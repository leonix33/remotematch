const tractionService = require('../services/tractionService');

async function trace(req, res, next) {
  try {
    const data = await tractionService.buildTractionTrace(req.user.sub);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function previewDigest(req, res, next) {
  try {
    res.json(await tractionService.previewDigest(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function sendDigest(req, res, next) {
  try {
    const result = await tractionService.sendAppliedDigestEmail(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function scan(req, res, next) {
  try {
    const result = await tractionService.scanAndNotifyTraction(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markDone(req, res, next) {
  try {
    const { notes } = req.body || {};
    const result = await tractionService.markFollowUpDone(req.user.sub, req.params.jobId, notes);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { trace, previewDigest, sendDigest, scan, markDone };
