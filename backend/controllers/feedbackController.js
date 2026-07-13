const Feedback = require('../models/Feedback');
const Client = require('../models/Client');

const submitFeedback = async (req, res) => {
  try {
    const { clientId, rating, comment, category, isAnonymous } = req.body;
    const userId = req.session.user._id;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const feedback = new Feedback({ clientId, submittedBy: userId, rating, comment, category, isAnonymous });
    await feedback.save();

    // Update client averageRating
    const allFeedback = await Feedback.find({ clientId });
    const avg = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    await Client.findByIdAndUpdate(clientId, { averageRating: Math.round(avg * 10) / 10, feedbackCount: allFeedback.length });

    res.status(201).json({ success: true, message: 'Feedback submitted', data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getClientFeedback = async (req, res) => {
  try {
    const { clientId } = req.params;
    const feedback = await Feedback.find({ clientId })
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') return res.status(403).json({ success: false, message: 'Manager only' });
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const feedback = await Feedback.find(query)
      .populate('clientId', 'name company')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getFeedbackStats = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') return res.status(403).json({ success: false, message: 'Manager only' });
    const stats = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } }
    ]);
    const byCategory = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    res.json({ success: true, data: { stats: stats[0] || {}, byCategory } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') return res.status(403).json({ success: false, message: 'Manager only' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const feedback = await Feedback.findByIdAndUpdate(id, { status }, { new: true });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { submitFeedback, getClientFeedback, getAllFeedback, getFeedbackStats, updateFeedbackStatus };
