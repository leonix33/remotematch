const approvalService = require('../services/approvalService');

async function list(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    const items = await approvalService.listForUser(req.user.sub, status);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const counts = await approvalService.counts(req.user.sub);
    res.json(counts);
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const item = await approvalService.setStatus(req.user.sub, req.params.jobId, 'approved', req.body.notes);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const item = await approvalService.setStatus(req.user.sub, req.params.jobId, 'rejected', req.body.notes);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, summary, approve, reject };
