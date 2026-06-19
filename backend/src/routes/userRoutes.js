const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/', requireAuth, requireAdmin, userController.listUsers);
router.post('/', requireAuth, requireAdmin, userController.createUser);

module.exports = router;
