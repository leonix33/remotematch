const AgentRun = require('../models/AgentRun');
const jobService = require('../services/jobService');
const approvalService = require('../services/approvalService');
const profileService = require('../services/profileService');
const teamService = require('../services/teamService');
const { scoreJobsForProfile } = require('../services/jobScoringService');
const env = require('../config/env');

async function runAgent(req, res, next) {
  try {
    await teamService.checkLimit(req.user.sub, 'agent');
    let run;
    if (env.mongoUri) {
      run = await AgentRun.create({ status: 'running', startedBy: req.user.sub, mode: 'search' });
    }
    const output = await jobService.runAgentScript({ autoApply: false });
    await jobService.syncJobsToMongo();
    await jobService.syncApplicationsToMongo();
    if (run) {
      run.status = 'completed';
      run.output = output.slice(-4000);
      run.finishedAt = new Date();
      await run.save();
    }
    await teamService.incrementUsage(req.user.sub, 'agent');
    res.json({
      message: 'Agent search completed (no auto-apply). Review jobs in Apply Queue, then click Apply Approved.',
      output: output.slice(-2000),
    });
  } catch (err) {
    if (env.mongoUri) {
      await AgentRun.create({
        status: 'failed',
        error: err.message,
        startedBy: req.user.sub,
        finishedAt: new Date(),
      });
    }
    next(err);
  }
}

async function applyApproved(req, res, next) {
  try {
    const approved = await approvalService.listApproved(req.user.sub);
    if (!approved.length) {
      return res.status(400).json({ message: 'No approved jobs in your queue. Approve jobs first.' });
    }

    const profile = await profileService.getOrCreate(req.user.sub);
    const scored = scoreJobsForProfile(approved, profile);

    let run;
    if (env.mongoUri) {
      run = await AgentRun.create({
        status: 'running',
        startedBy: req.user.sub,
        mode: 'apply-approved',
      });
    }

    const itemsFile = jobService.writeApprovedItemsFile(scored);
    let output;
    try {
      output = await jobService.runApprovedAutoApply(itemsFile);
      await jobService.syncApplicationsToMongo();
      await approvalService.markApplied(
        req.user.sub,
        scored.map((j) => j.jobId)
      );
      if (run) {
        run.status = 'completed';
        run.output = output.slice(-4000);
        run.finishedAt = new Date();
        await run.save();
      }
      res.json({
        message: `Applied to ${scored.length} approved job(s)`,
        count: scored.length,
        output: output.slice(-2000),
      });
    } catch (applyErr) {
      if (run) {
        run.status = 'failed';
        run.error = applyErr.message;
        run.finishedAt = new Date();
        await run.save();
      }
      res.status(202).json({
        message: applyErr.message,
        count: scored.length,
        itemsFile,
        hint: 'On Mac: cd job-event-agent && bash apply_approved.sh ' + itemsFile,
      });
    }
  } catch (err) {
    next(err);
  }
}

async function listRuns(req, res, next) {
  try {
    if (!env.mongoUri) return res.json([]);
    const runs = await AgentRun.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json(runs);
  } catch (err) {
    next(err);
  }
}

module.exports = { runAgent, applyApproved, listRuns };
