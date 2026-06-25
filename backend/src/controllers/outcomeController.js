const { z } = require('zod');
const outcomeService = require('../services/outcomeService');

async function list(req, res, next) {
  try {
    res.json(await outcomeService.list(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function upsert(req, res, next) {
  try {
    const body = z
      .object({
        jobId: z.string(),
        title: z.string().optional(),
        company: z.string().optional(),
        stage: z.enum(['applied', 'screen', 'onsite', 'offer', 'rejected', 'withdrawn']),
        source: z.string().optional(),
        matchPct: z.number().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);
    res.json(await outcomeService.upsert(req.user.sub, body));
  } catch (err) {
    next(err);
  }
}

async function insights(req, res, next) {
  try {
    res.json(await outcomeService.insights(req.user.sub));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upsert, insights };
