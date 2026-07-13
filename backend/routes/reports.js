const express = require('express');
const { getSummary, getEmployeePerformance, getRevenueReport, getEmployeeQuickStats } = require('../controllers/reportController');
const { requireAuth, checkRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/employees', checkRole('manager'), getEmployeePerformance);
router.get('/revenue', getRevenueReport);
router.get('/employee-quick-stats', getEmployeeQuickStats);

module.exports = router;
