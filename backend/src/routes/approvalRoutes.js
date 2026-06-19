const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const approvalController = require('../controllers/approvalController');

router.get('/', requireAuth, approvalController.list);
router.get('/summary', requireAuth, approvalController.summary);
router.post('/:jobId/approve', requireAuth, approvalController.approve);
router.post('/:jobId/reject', requireAuth, approvalController.reject);

module.exports = router;
