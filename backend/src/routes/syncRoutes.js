const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const syncController = require('../controllers/syncController');

router.get('/status', requireAuth, syncController.status);
router.post('/all', requireAuth, syncController.syncAll);

module.exports = router;
