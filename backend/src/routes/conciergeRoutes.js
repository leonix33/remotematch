const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const conciergeController = require('../controllers/conciergeController');

router.post('/ask', requireAuth, conciergeController.ask);
router.get('/snapshot', requireAuth, conciergeController.snapshot);

module.exports = router;
