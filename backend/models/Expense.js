const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['travel', 'meals', 'software', 'hardware', 'consulting', 'marketing', 'office', 'other'],
    default: 'other'
  },
  date: { type: Date, default: Date.now },
  isInvoiced: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null }
}, { timestamps: true });

expenseSchema.index({ clientId: 1, isInvoiced: 1 });
expenseSchema.index({ userId: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
