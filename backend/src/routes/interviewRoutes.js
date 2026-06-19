const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const interviewController = require('../controllers/interviewController');

router.get('/', requireAuth, interviewController.list);
router.post('/start', requireAuth, interviewController.start);
router.post('/:id/respond', requireAuth, interviewController.respond);
router.post('/:id/end', requireAuth, interviewController.end);

module.exports = router;
