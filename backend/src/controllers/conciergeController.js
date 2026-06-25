const { z } = require('zod');
const conciergeService = require('../services/conciergeService');
const teamService = require('../services/teamService');

const askSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

async function ask(req, res, next) {
  try {
    await teamService.checkLimit(req.user.sub, 'ai');
    const body = askSchema.parse(req.body);
    const result = await conciergeService.ask(req.user.sub, body.message, body.history || []);
    await teamService.incrementUsage(req.user.sub, 'ai');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function snapshot(req, res, next) {
  try {
    const data = await conciergeService.buildSnapshot(req.user.sub);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { ask, snapshot };
