const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

router.post('/chat', requireAuth, aiController.send);
router.get('/history', requireAuth, aiController.history);
router.delete('/history', requireAuth, aiController.clear);

module.exports = router;
