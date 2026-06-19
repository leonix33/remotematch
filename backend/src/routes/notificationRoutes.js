const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/', requireAuth, notificationController.list);
router.get('/unread', requireAuth, notificationController.unread);
router.post('/:id/read', requireAuth, notificationController.markRead);
router.post('/read-all', requireAuth, notificationController.markAllRead);

module.exports = router;
