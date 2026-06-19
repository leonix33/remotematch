const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/', requireAuth, requireAdmin, userController.listUsers);
router.post('/', requireAuth, requireAdmin, userController.createUser);
router.patch('/:id', requireAuth, requireAdmin, userController.updateUser);
router.post('/:id/reset-password', requireAuth, requireAdmin, userController.resetPassword);

module.exports = router;
