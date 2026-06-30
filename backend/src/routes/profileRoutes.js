const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.get('/me', requireAuth, profileController.getMe);
router.get('/me/apply-preview', requireAuth, profileController.getApplyPreview);
router.patch('/me', requireAuth, profileController.updateMe);
router.post('/me/openai-key', requireAuth, profileController.saveOpenAiKey);
router.delete('/me/openai-key', requireAuth, profileController.clearOpenAiKey);
router.post('/me/openai-key/test', requireAuth, profileController.testOpenAiKey);
router.post('/me/hunter-key', requireAuth, profileController.saveHunterKey);
router.delete('/me/hunter-key', requireAuth, profileController.clearHunterKey);
router.post('/me/apollo-key', requireAuth, profileController.saveApolloKey);
router.delete('/me/apollo-key', requireAuth, profileController.clearApolloKey);
router.post('/resume/parse', requireAuth, profileController.parseResume);

module.exports = router;
