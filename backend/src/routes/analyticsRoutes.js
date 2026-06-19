const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', requireAuth, analyticsController.summary);

module.exports = router;
