const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const applicationController = require('../controllers/applicationController');
const applicationKitController = require('../controllers/applicationKitController');

router.get('/', requireAuth, applicationController.listApplications);
router.post('/import', requireAuth, applicationController.importApplications);
router.get('/kit/:jobId', requireAuth, applicationKitController.getKit);
router.post('/kit/:jobId/generate', requireAuth, applicationKitController.generateKit);

module.exports = router;
