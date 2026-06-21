const router = require('express').Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/extension-token', requireAuth, authController.extensionToken);
router.get('/export-data', requireAuth, authController.exportData);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;
