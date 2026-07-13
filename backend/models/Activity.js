const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'follow-up', 'demo', 'proposal', 'other'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  outcome: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  nextFollowUp: { type: Date }
}, { timestamps: true });

activitySchema.index({ clientId: 1, date: -1 });
activitySchema.index({ userId: 1 });

module.exports = mongoose.model('Activity', activitySchema);
