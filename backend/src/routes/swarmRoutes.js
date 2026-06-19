const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const swarmController = require('../controllers/swarmController');

router.get('/', requireAuth, swarmController.list);
router.post('/run', requireAuth, swarmController.run);

module.exports = router;
