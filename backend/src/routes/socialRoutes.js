const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const socialController = require('../controllers/socialController');

router.get('/pods', requireAuth, socialController.listPods);
router.post('/pods', requireAuth, socialController.createPod);
router.get('/watchlist', requireAuth, socialController.listWatchlist);
router.post('/watchlist', requireAuth, socialController.addWatchlist);
router.delete('/watchlist/:id', requireAuth, socialController.removeWatchlist);
router.get('/referrals', requireAuth, socialController.listReferrals);
router.post('/referrals', requireAuth, socialController.createReferral);
router.post('/referrals/:id/reply', requireAuth, socialController.replyReferral);
router.get('/victories', requireAuth, socialController.victoryFeed);
router.post('/victories', requireAuth, socialController.postVictory);
router.get('/mentors', requireAuth, socialController.listMentors);

module.exports = router;
