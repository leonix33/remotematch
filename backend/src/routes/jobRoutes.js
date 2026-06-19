const router = require('express').Router();
const { requireAuth } = require('../middleware/authMiddleware');
const jobController = require('../controllers/jobController');

router.get('/', requireAuth, jobController.listJobs);
router.post('/sync', requireAuth, jobController.syncJobs);
router.post('/import', requireAuth, jobController.importJobs);

module.exports = router;
