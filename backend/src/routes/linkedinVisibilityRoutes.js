const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const linkedinVisibilityController = require('../controllers/linkedinVisibilityController');

router.get('/posts', requireAuth, linkedinVisibilityController.list);
router.post('/posts/generate', requireAuth, linkedinVisibilityController.generate);
router.post('/posts/:id/posted', requireAuth, linkedinVisibilityController.markPosted);
router.delete('/posts/:id', requireAuth, linkedinVisibilityController.remove);

module.exports = router;
