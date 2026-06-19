const { z } = require('zod');
const profileService = require('../services/profileService');

const updateSchema = z.object({
  displayName: z.string().min(2).optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  targetTitles: z.array(z.string()).optional(),
  mustHaveSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  targetCompanies: z.array(z.string()).optional(),
  resumeText: z.string().optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
  onboardingComplete: z.boolean().optional(),
});

function parseListField(value) {
  if (Array.isArray(value)) return value.map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

async function getMe(req, res, next) {
  try {
    const profile = await profileService.getOrCreate(req.user.sub);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const body = updateSchema.parse(req.body);
    const payload = { ...body };
    if (body.targetTitles) payload.targetTitles = parseListField(body.targetTitles);
    if (body.mustHaveSkills) payload.mustHaveSkills = parseListField(body.mustHaveSkills);
    if (body.niceToHaveSkills) payload.niceToHaveSkills = parseListField(body.niceToHaveSkills);
    if (body.targetCompanies) payload.targetCompanies = parseListField(body.targetCompanies);
    const profile = await profileService.update(req.user.sub, payload);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
