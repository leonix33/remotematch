const router = require('express').Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/extension-token', requireAuth, authController.extensionToken);

module.exports = router;
