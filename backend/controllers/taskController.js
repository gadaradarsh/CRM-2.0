const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// Create task (manager only)
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const task = new Task({
      title, description, priority, dueDate,
      assignedTo: assignedTo || req.session.user._id,
      createdBy: req.session.user._id
    });
    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Task created successfully', task: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get tasks for current user
const getMyTasks = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { status, priority } = req.query;
    let query = {};

    if (userRole === 'employee') {
      query.assignedTo = userId;
    } else {
      // Manager: optionally filter by assigned
      if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (userRole === 'employee' && task.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
    if (notes) task.description = notes;
    await task.save();

    res.json({ success: true, message: 'Task status updated', task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get task stats
const getTaskStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const query = userRole === 'employee' ? { assignedTo: userId } : {};

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'pending' }),
      Task.countDocuments({ ...query, status: 'in-progress' }),
      Task.countDocuments({ ...query, status: 'completed' })
    ]);

    // Overdue tasks
    const overdue = await Task.countDocuments({
      ...query,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    });

    res.json({ success: true, stats: { total, pending, inProgress, completed, overdue } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete task (manager only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getMyTasks, updateTaskStatus, getTaskStats, deleteTask };
