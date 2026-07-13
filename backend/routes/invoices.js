const express = require('express');
const { generateInvoice, getClientInvoices, getAllInvoices, getInvoice, updateInvoiceStatus, deleteInvoice, downloadInvoice } = require('../controllers/invoiceController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/clients/:clientId/invoices/generate', generateInvoice);
router.get('/clients/:clientId/invoices', getClientInvoices);
router.get('/invoices', getAllInvoices);
router.get('/invoices/:id', getInvoice);
router.patch('/invoices/:id/status', updateInvoiceStatus);
router.delete('/invoices/:id', deleteInvoice);
router.get('/invoices/:id/download', downloadInvoice);

module.exports = router;
