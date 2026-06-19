const { z } = require('zod');
const generationService = require('../services/generationService');

const schema = z.object({
  jobTitle: z.string().min(2),
  company: z.string().min(1),
  tone: z.string().default('Professional'),
  goal: z.string().default('Highlight cloud and DevOps experience'),
});

async function createGeneration(req, res, next) {
  try {
    const body = schema.parse(req.body);
    const result = await generationService.generateCoverLetter({
      ...body,
      userId: req.user.sub,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createGeneration };
