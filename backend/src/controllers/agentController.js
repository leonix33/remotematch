const { z } = require('zod');
const AgentRun = require('../models/AgentRun');
const jobService = require('../services/jobService');
const env = require('../config/env');

async function runAgent(req, res, next) {
  try {
    let run;
    if (env.mongoUri) {
      run = await AgentRun.create({ status: 'running', startedBy: req.user.sub });
    }
    const output = await jobService.runAgentScript();
    await jobService.syncJobsToMongo();
    await jobService.syncApplicationsToMongo();
    if (run) {
      run.status = 'completed';
      run.output = output.slice(-4000);
      run.finishedAt = new Date();
      await run.save();
    }
    res.json({ message: 'Agent run completed', output: output.slice(-2000) });
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

async function listRuns(req, res, next) {
  try {
    if (!env.mongoUri) return res.json([]);
    const runs = await AgentRun.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json(runs);
  } catch (err) {
    next(err);
  }
}

module.exports = { runAgent, listRuns };
