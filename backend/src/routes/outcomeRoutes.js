const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const outcomeController = require('../controllers/outcomeController');

router.get('/', requireAuth, outcomeController.list);
router.get('/insights', requireAuth, outcomeController.insights);
router.post('/', requireAuth, outcomeController.upsert);

module.exports = router;
