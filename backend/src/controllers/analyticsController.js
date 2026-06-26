const analyticsService = require('../services/analyticsService');

async function summary(req, res, next) {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.sub;
    const data = await analyticsService.summary(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
