const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  category: {
    type: String,
    enum: ['service', 'communication', 'product', 'support', 'general'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  isAnonymous: { type: Boolean, default: false }
}, { timestamps: true });

feedbackSchema.index({ clientId: 1 });
feedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
