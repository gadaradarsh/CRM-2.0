const Expense = require('../models/Expense');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Add expense to a client
const addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { clientId } = req.params;
    const { description, amount, category, date } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const expense = new Expense({ clientId, userId, description, amount, category: category || 'other', date: date || new Date() });
    await expense.save();
    const populated = await Expense.findById(expense._id)
      .populate('clientId', 'name company')
      .populate('userId', 'name email');
    res.status(201).json({ success: true, message: 'Expense added successfully', expense: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get expenses for a client
const getClientExpenses = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { isInvoiced } = req.query;
    let query = { clientId };
    if (isInvoiced !== undefined) query.isInvoiced = isInvoiced === 'true';

    const expenses = await Expense.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 });

    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all expenses (manager sees all, employee sees own)
const getAllExpenses = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { category, isInvoiced, page = 1, limit = 20 } = req.query;

    let query = {};
    if (userRole === 'employee') query.userId = userId;
    if (category) query.category = category;
    if (isInvoiced !== undefined) query.isInvoiced = isInvoiced === 'true';

    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('clientId', 'name company')
        .populate('userId', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);

    res.json({ success: true, expenses, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (userRole === 'employee' && expense.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (expense.isInvoiced) {
      return res.status(400).json({ success: false, message: 'Cannot edit an invoiced expense' });
    }

    const { description, amount, category, date } = req.body;
    const updated = await Expense.findByIdAndUpdate(id, { description, amount, category, date }, { new: true })
      .populate('clientId', 'name company')
      .populate('userId', 'name email');

    res.json({ success: true, message: 'Expense updated', expense: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (userRole === 'employee' && expense.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (expense.isInvoiced) {
      return res.status(400).json({ success: false, message: 'Cannot delete an invoiced expense' });
    }

    await Expense.findByIdAndDelete(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Expense stats
const getExpenseStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const matchQuery = userRole === 'employee' ? { userId: new require('mongoose').Types.ObjectId(userId) } : {};

    const stats = await Expense.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        invoicedAmount: { $sum: { $cond: ['$isInvoiced', '$amount', 0] } },
        pendingAmount: { $sum: { $cond: ['$isInvoiced', 0, '$amount'] } },
        count: { $sum: 1 }
      }}
    ]);

    const byCategory = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, stats: stats[0] || { totalAmount: 0, invoicedAmount: 0, pendingAmount: 0, count: 0 }, byCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { addExpense, getClientExpenses, getAllExpenses, updateExpense, deleteExpense, getExpenseStats };
