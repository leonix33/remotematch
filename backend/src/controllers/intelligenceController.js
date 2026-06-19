const { z } = require('zod');
const intelligenceService = require('../services/intelligenceService');
const marketPulseService = require('../services/marketPulseService');

async function matchCopilot(req, res, next) {
  try {
    const result = await intelligenceService.matchCopilot(req.user.sub, req.params.jobId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function companyIntel(req, res, next) {
  try {
    const result = await intelligenceService.companyIntel(req.user.sub, req.params.company);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function salaryOracle(req, res, next) {
  try {
    const body = z.object({ query: z.string().min(3) }).parse(req.body);
    const result = await intelligenceService.salaryOracle(req.user.sub, body.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resumeDiff(req, res, next) {
  try {
    const result = await intelligenceService.resumeDiff(req.user.sub, req.params.jobId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function agentWhisper(req, res, next) {
  try {
    const items = await intelligenceService.agentWhisper(req.user.sub);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function voiceApply(req, res, next) {
  try {
    const body = z.object({ transcript: z.string().min(3) }).parse(req.body);
    const parsed = await intelligenceService.voiceApplyParse(req.user.sub, body.transcript);
    const approvalService = require('../services/approvalService');
    const queued = [];
    for (const jobId of (parsed.jobIds || []).slice(0, parsed.count || 3)) {
      try {
        await approvalService.setStatus(req.user.sub, jobId, 'approved', 'Voice apply command');
        queued.push(jobId);
      } catch {
        /* skip */
      }
    }
    res.json({ parsed, queued });
  } catch (err) {
    next(err);
  }
}

async function companyScan(req, res, next) {
  try {
    const company = req.query.company || req.params.company;
    const result = await intelligenceService.companyScan(req.user.sub, company);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function marketPulse(req, res, next) {
  try {
    const pulse = await marketPulseService.pulse();
    res.json(pulse);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  matchCopilot,
  companyIntel,
  salaryOracle,
  resumeDiff,
  agentWhisper,
  voiceApply,
  companyScan,
  marketPulse,
};
