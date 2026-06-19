const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const conferenceController = require('../controllers/conferenceController');

router.get('/', requireAuth, conferenceController.list);

module.exports = router;
