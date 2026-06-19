const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const applicationController = require('../controllers/applicationController');

router.get('/', requireAuth, applicationController.listApplications);
router.post('/import', requireAuth, applicationController.importApplications);

module.exports = router;
