const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid'],
    default: 'draft'
  },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
