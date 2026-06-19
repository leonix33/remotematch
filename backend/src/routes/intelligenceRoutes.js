const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const intelligenceController = require('../controllers/intelligenceController');

router.get('/market-pulse', requireAuth, intelligenceController.marketPulse);
router.get('/whisper', requireAuth, intelligenceController.agentWhisper);
router.post('/voice-apply', requireAuth, intelligenceController.voiceApply);
router.get('/scan', requireAuth, intelligenceController.companyScan);
router.get('/scan/:company', requireAuth, intelligenceController.companyScan);
router.get('/match/:jobId', requireAuth, intelligenceController.matchCopilot);
router.get('/company/:company', requireAuth, intelligenceController.companyIntel);
router.post('/salary', requireAuth, intelligenceController.salaryOracle);
router.get('/resume/:jobId', requireAuth, intelligenceController.resumeDiff);

module.exports = router;
