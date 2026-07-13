const Client = require('../models/Client');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');

const getSummary = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const clientQuery = userRole === 'employee' ? { assignedTo: userId } : {};
    const taskQuery = userRole === 'employee' ? { assignedTo: userId } : {};

    const [totalClients, wonClients, totalTasks, completedTasks] = await Promise.all([
      Client.countDocuments(clientQuery),
      Client.countDocuments({ ...clientQuery, status: 'won' }),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' })
    ]);

    const revenueAgg = await Expense.aggregate([
      { $match: userRole === 'employee' ? { userId: new mongoose.Types.ObjectId(userId) } : {} },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const clientsByStatus = await Client.aggregate([
      { $match: clientQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: { totalClients, wonClients, totalRevenue: revenueAgg[0]?.total || 0, totalTasks, completedTasks, clientsByStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getEmployeePerformance = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') return res.status(403).json({ success: false, message: 'Manager only' });
    const employees = await User.find({ role: 'employee', isActive: true }).select('_id name email');
    const performance = await Promise.all(employees.map(async (emp) => {
      const oid = new mongoose.Types.ObjectId(emp._id);
      const [clients, wonClients, tasks, completedTasks, expenses] = await Promise.all([
        Client.countDocuments({ assignedTo: emp._id }),
        Client.countDocuments({ assignedTo: emp._id, status: 'won' }),
        Task.countDocuments({ assignedTo: emp._id }),
        Task.countDocuments({ assignedTo: emp._id, status: 'completed' }),
        Expense.aggregate([{ $match: { userId: oid } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);
      return { employee: { _id: emp._id, name: emp.name, email: emp.email }, clients, wonClients, tasks, completedTasks, totalExpenses: expenses[0]?.total || 0, taskCompletionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0 };
    }));
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const matchQuery = userRole === 'employee' ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    const groupBy = period === 'yearly' ? { year: { $year: '$date' } } : { year: { $year: '$date' }, month: { $month: '$date' } };
    const revenue = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: groupBy, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    res.json({ success: true, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getEmployeeQuickStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const oid = new mongoose.Types.ObjectId(userId);
    const [assignedClients, myTasks, pendingTasks, myExpenses] = await Promise.all([
      Client.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: { $ne: 'completed' } }),
      Expense.aggregate([{ $match: { userId: oid } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const recentClients = await Client.find({ assignedTo: userId }).sort({ createdAt: -1 }).limit(5).select('name company status');
    res.json({ success: true, data: { assignedClients, myTasks, pendingTasks, totalExpenses: myExpenses[0]?.total || 0, recentClients } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getSummary, getEmployeePerformance, getRevenueReport, getEmployeeQuickStats };
