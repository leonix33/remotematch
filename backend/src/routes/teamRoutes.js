const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const teamController = require('../controllers/teamController');

router.get('/usage', requireAuth, teamController.getUsage);
router.post('/upgrade', requireAuth, teamController.upgrade);

module.exports = router;
