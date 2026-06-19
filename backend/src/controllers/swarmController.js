const swarmService = require('../services/swarmService');

async function run(req, res, next) {
  try {
    const result = await swarmService.run(req.user.sub);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    res.json(await swarmService.list(req.user.sub));
  } catch (err) {
    next(err);
  }
}

module.exports = { run, list };
