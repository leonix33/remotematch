const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const setupController = require('../controllers/setupController');

router.get('/status', requireAuth, setupController.status);
router.post('/adzuna', requireAuth, requireAdmin, setupController.saveAdzuna);
router.post('/test-email', requireAuth, requireAdmin, setupController.testEmail);

module.exports = router;
