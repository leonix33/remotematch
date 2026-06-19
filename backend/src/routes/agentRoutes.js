const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const agentController = require('../controllers/agentController');

router.post('/run', requireAuth, agentController.runAgent);
router.post('/apply-approved', requireAuth, agentController.applyApproved);
router.get('/runs', requireAuth, agentController.listRuns);

module.exports = router;
