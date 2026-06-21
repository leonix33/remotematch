const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.get('/me', requireAuth, profileController.getMe);
router.patch('/me', requireAuth, profileController.updateMe);
router.post('/resume/parse', requireAuth, profileController.parseResume);

module.exports = router;
