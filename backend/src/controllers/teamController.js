const teamService = require('../services/teamService');

async function getUsage(req, res, next) {
  try {
    const summary = await teamService.getUsageSummary(req.user.sub);
    res.json(summary || { plan: 'free', unlimited: true });
  } catch (err) {
    next(err);
  }
}

async function upgrade(req, res, next) {
  try {
    const { plan } = req.body;
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    const team = await teamService.upgradePlan(req.user.sub, plan);
    res.json({ plan: team.plan, message: `Team plan set to ${plan}` });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsage, upgrade };
