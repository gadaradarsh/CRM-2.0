const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Client = require('../models/Client');
const PDFDocument = require('pdfkit');

const generateInvoice = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { dueDate, notes, selectedExpenseIds } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    if (!dueDate) return res.status(400).json({ success: false, message: 'Due date is required' });

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let query = { clientId };
    if (selectedExpenseIds && selectedExpenseIds.length > 0) {
      query._id = { $in: selectedExpenseIds };
    } else {
      query.isInvoiced = false;
    }

    const expenses = await Expense.find(query).sort({ date: 1 });
    if (expenses.length === 0) {
      return res.status(400).json({ success: false, message: 'No uninvoiced expenses found for this client' });
    }

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

    const invoice = new Invoice({
      invoiceNumber, clientId,
      expenses: expenses.map(e => e._id),
      totalAmount,
      dueDate: new Date(dueDate),
      notes: notes || '',
      createdBy: userId
    });
    await invoice.save();

    await Expense.updateMany(
      { _id: { $in: expenses.map(e => e._id) } },
      { $set: { isInvoiced: true, invoiceId: invoice._id } }
    );

    await invoice.populate([
      { path: 'clientId', select: 'name company email phone' },
      { path: 'expenses', select: 'description category amount date' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({ success: true, message: 'Invoice generated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getClientInvoices = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const invoices = await Invoice.find({ clientId })
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .sort({ issueDate: -1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { status } = req.query;

    let query = {};
    if (status) query.status = status;

    // Employees only see invoices for their clients
    if (userRole === 'employee') {
      const myClients = await Client.find({ assignedTo: userId }).select('_id');
      query.clientId = { $in: myClients.map(c => c._id) };
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name company email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .populate('expenses', 'description category amount date');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (userRole === 'employee' && invoice.clientId.assignedTo && invoice.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'sent', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice status updated', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft invoices can be deleted' });
    }
    await Expense.updateMany({ _id: { $in: invoice.expenses } }, { $set: { isInvoiced: false, invoiceId: null } });
    await Invoice.findByIdAndDelete(id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .populate('expenses', 'description category amount date');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);

    // Header gradient bar (simulated with color rect)
    doc.rect(0, 0, 612, 80).fill('#1a1a2e');
    doc.fontSize(28).fillColor('#ffffff').text('INVOICE', 50, 25);
    doc.fontSize(11).fillColor('#a0aec0').text('CRM Manager System', 50, 58);

    doc.fontSize(10).fillColor('#1a1a2e');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, 25);
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 40);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 55);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, 70);

    // Bill To
    doc.moveDown(3);
    doc.fontSize(12).fillColor('#2d3748').text('Bill To:', 50, 110);
    doc.fontSize(14).fillColor('#1a1a2e').text(invoice.clientId.name, 50, 128);
    if (invoice.clientId.company) doc.fontSize(11).fillColor('#4a5568').text(invoice.clientId.company, 50, 145);
    if (invoice.clientId.email) doc.text(invoice.clientId.email, 50, 160);
    if (invoice.clientId.phone) doc.text(invoice.clientId.phone, 50, 175);

    // Items table header
    let y = 220;
    doc.rect(50, y, 510, 24).fill('#1a1a2e');
    doc.fontSize(10).fillColor('#ffffff');
    doc.text('Description', 60, y + 7);
    doc.text('Category', 260, y + 7);
    doc.text('Date', 380, y + 7);
    doc.text('Amount', 480, y + 7);

    y += 24;
    let alt = false;
    invoice.expenses.forEach((exp) => {
      if (alt) doc.rect(50, y, 510, 20).fill('#f7fafc');
      doc.fontSize(10).fillColor('#2d3748');
      doc.text(exp.description, 60, y + 5, { width: 190 });
      doc.text(exp.category, 260, y + 5);
      doc.text(new Date(exp.date).toLocaleDateString(), 380, y + 5);
      doc.text(`₹${exp.amount.toFixed(2)}`, 480, y + 5);
      y += 20;
      alt = !alt;
    });

    // Total
    y += 10;
    doc.moveTo(50, y).lineTo(560, y).stroke('#e2e8f0');
    y += 15;
    doc.rect(390, y, 170, 30).fill('#1a1a2e');
    doc.fontSize(13).fillColor('#ffffff').text(`Total: ₹${invoice.totalAmount.toFixed(2)}`, 400, y + 8);

    if (invoice.notes) {
      y += 50;
      doc.fontSize(11).fillColor('#4a5568').text('Notes:', 50, y);
      doc.fontSize(10).fillColor('#2d3748').text(invoice.notes, 50, y + 15);
    }

    y += 80;
    doc.fontSize(10).fillColor('#a0aec0').text('Thank you for your business! — CRM Manager', 50, y);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { generateInvoice, getClientInvoices, getAllInvoices, getInvoice, updateInvoiceStatus, deleteInvoice, downloadInvoice };
