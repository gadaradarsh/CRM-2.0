const express = require('express');
const { getClientActivities, getAllActivities, createActivity, updateActivity, deleteActivity } = require('../controllers/activityController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/client/:clientId', getClientActivities);
router.get('/all', getAllActivities);
router.post('/client/:clientId', createActivity);
router.patch('/:id', updateActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
