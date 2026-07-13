const express = require('express');
const { submitFeedback, getClientFeedback, getAllFeedback, getFeedbackStats, updateFeedbackStatus } = require('../controllers/feedbackController');
const { requireAuth, checkRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/submit', submitFeedback);
router.get('/client/:clientId', getClientFeedback);
router.get('/', checkRole('manager'), getAllFeedback);
router.get('/stats', checkRole('manager'), getFeedbackStats);
router.patch('/:id/status', checkRole('manager'), updateFeedbackStatus);

module.exports = router;
