const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const pushController = require('../controllers/pushController');

router.get('/vapid-public-key', pushController.getVapidKey);
router.post('/subscribe', requireAuth, pushController.subscribe);
router.post('/unsubscribe', requireAuth, pushController.unsubscribe);

module.exports = router;
