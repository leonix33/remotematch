const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const applicationController = require('../controllers/applicationController');

router.get('/', requireAuth, applicationController.listApplications);

module.exports = router;
