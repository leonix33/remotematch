const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const generationController = require('../controllers/generationController');

router.post('/', requireAuth, generationController.createGeneration);

module.exports = router;
