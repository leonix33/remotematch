const teamService = require('../services/teamService');

function requireLimit(type) {
  return async (req, res, next) => {
    try {
      await teamService.checkLimit(req.user.sub, type);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireLimit };
