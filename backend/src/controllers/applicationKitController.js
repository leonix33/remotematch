const applicationKitService = require('../services/applicationKitService');

async function getKit(req, res, next) {
  try {
    const kit = applicationKitService.getKit(req.user.sub, req.params.jobId);
    if (!kit) {
      return res.status(404).json({ message: 'No application kit yet. Generate one from the apply queue or jobs page.' });
    }
    res.json(kit);
  } catch (err) {
    next(err);
  }
}

async function generateKit(req, res, next) {
  try {
    const tailorResume = req.body?.tailorResume !== false;
    const kit = await applicationKitService.generateForJob(req.user.sub, req.params.jobId, {
      tailorResume,
      force: Boolean(req.body?.force),
    });
    res.json(kit);
  } catch (err) {
    next(err);
  }
}

module.exports = { getKit, generateKit };
