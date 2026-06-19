const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.get('/summary', requireAuth, chatController.summary);
router.get('/contacts', requireAuth, chatController.contacts);
router.get('/requests/incoming', requireAuth, chatController.incomingRequests);
router.post('/requests', requireAuth, chatController.sendDmRequest);
router.post('/requests/:id/accept', requireAuth, chatController.acceptRequest);
router.post('/requests/:id/decline', requireAuth, chatController.declineRequest);
router.post('/groups', requireAuth, chatController.createGroup);
router.get('/conversations', requireAuth, chatController.listConversations);
router.get('/conversations/:id/messages', requireAuth, chatController.getMessages);
router.post('/conversations/:id/messages', requireAuth, chatController.sendMessage);

module.exports = router;
