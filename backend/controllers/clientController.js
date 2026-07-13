const Client = require('../models/Client');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const getClients = async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    let query = {};

    if (userRole === 'employee') query.assignedTo = userId;
    if (status) query.status = status;
    if (assignedTo && userRole === 'manager') query.assignedTo = assignedTo;

    const clients = await Client.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, phone, company, notes, estimatedValue, assignedTo } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const assignedUserId = userRole === 'employee' ? userId : (assignedTo || userId);

    const client = new Client({ name, email, phone, company, notes: notes || '', estimatedValue: estimatedValue || 0, assignedTo: assignedUserId, createdBy: userId });
    await client.save();

    const populated = await Client.findById(client._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Client created successfully', client: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { id } = req.params;
    const updates = { ...req.body };
    if (req.session.user.role === 'employee') delete updates.assignedTo;

    const client = await Client.findByIdAndUpdate(
      id,
      { ...updates, lastContactDate: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client updated successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const assignClient = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'employee') {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }
    const client = await Client.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true })
      .populate('assignedTo', 'name email').populate('createdBy', 'name email');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client assigned successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status, lastContactDate: new Date() },
      { new: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Status updated successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient, assignClient, updateStatus };
