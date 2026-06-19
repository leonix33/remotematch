const { z } = require('zod');
const aiCoachService = require('../services/aiCoachService');

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
});

async function send(req, res, next) {
  try {
    const body = chatSchema.parse(req.body);
    const result = await aiCoachService.chat(req.user.sub, body.message);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const messages = await aiCoachService.getHistory(req.user.sub);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function clear(req, res, next) {
  try {
    await aiCoachService.clearHistory(req.user.sub);
    res.json({ message: 'History cleared' });
  } catch (err) {
    next(err);
  }
}

module.exports = { send, history, clear };
