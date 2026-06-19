const conferenceService = require('../services/conferenceService');

async function list(req, res, next) {
  try {
    const items = await conferenceService.list({
      format: req.query.format,
      weekOnly: req.query.week === 'true',
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
