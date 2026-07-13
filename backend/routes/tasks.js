const express = require('express');
const { body } = require('express-validator');
const { createTask, getMyTasks, updateTaskStatus, getTaskStats, deleteTask } = require('../controllers/taskController');
const { requireAuth, checkRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/', checkRole('manager'), [
  body('title').trim().isLength({ min: 2 }).withMessage('Title required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('assignedTo').optional().isMongoId()
], createTask);

router.get('/my-tasks', getMyTasks);
router.get('/stats', getTaskStats);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', checkRole('manager'), deleteTask);

module.exports = router;
