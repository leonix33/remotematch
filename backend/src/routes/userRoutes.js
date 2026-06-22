const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { requireMongo } = require('../middleware/mongoMiddleware');
const userController = require('../controllers/userController');

router.get('/', requireAuth, requireAdmin, requireMongo, userController.listUsers);
router.post('/', requireAuth, requireAdmin, requireMongo, userController.createUser);
router.patch('/:id', requireAuth, requireAdmin, requireMongo, userController.updateUser);
router.delete('/:id', requireAuth, requireAdmin, requireMongo, userController.deleteUser);
router.post('/:id/reset-password', requireAuth, requireAdmin, requireMongo, userController.resetPassword);

module.exports = router;
