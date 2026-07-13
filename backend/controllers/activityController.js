const Activity = require('../models/Activity');
const Client = require('../models/Client');

const getClientActivities = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const activities = await Activity.find({ clientId })
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { page = 1, limit = 20, type } = req.query;

    let query = {};
    if (userRole === 'employee') query.userId = userId;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const activities = await Activity.find(query)
      .populate('clientId', 'name company')
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const createActivity = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { type, title, description, outcome, date, nextFollowUp } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const activity = new Activity({ clientId, userId, type, title, description, outcome, date: date || new Date(), nextFollowUp });
    await activity.save();
    await activity.populate('userId', 'name email');

    res.status(201).json({ success: true, message: 'Activity logged', data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByIdAndUpdate(id, req.body, { new: true }).populate('userId', 'name email');
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getClientActivities, getAllActivities, createActivity, updateActivity, deleteActivity };
