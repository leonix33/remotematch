const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const tractionController = require('../controllers/tractionController');

router.get('/trace', requireAuth, tractionController.trace);
router.get('/digest/preview', requireAuth, tractionController.previewDigest);
router.post('/digest/send', requireAuth, tractionController.sendDigest);
router.post('/scan', requireAuth, tractionController.scan);
router.post('/follow-up/:jobId/done', requireAuth, tractionController.markDone);

module.exports = router;
