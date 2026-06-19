const { z } = require('zod');
const interviewService = require('../services/interviewService');

async function start(req, res, next) {
  try {
    const body = z
      .object({
        jobTitle: z.string().min(2),
        company: z.string().min(2),
        mode: z.enum(['text', 'voice']).default('text'),
      })
      .parse(req.body);
    const session = await interviewService.start(req.user.sub, body);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function respond(req, res, next) {
  try {
    const body = z.object({ answer: z.string().min(1) }).parse(req.body);
    const result = await interviewService.respond(req.user.sub, req.params.id, body.answer);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function end(req, res, next) {
  try {
    const result = await interviewService.endSession(req.user.sub, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const sessions = await interviewService.listSessions(req.user.sub);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

module.exports = { start, respond, end, list };
