const express = require('express');
const { body } = require('express-validator');
const { addExpense, getClientExpenses, getAllExpenses, updateExpense, deleteExpense, getExpenseStats } = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const expenseValidation = [
  body('description').trim().isLength({ min: 2 }).withMessage('Description required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn(['travel','meals','software','hardware','consulting','marketing','office','other'])
];

router.post('/clients/:clientId/expenses', expenseValidation, addExpense);
router.get('/clients/:clientId/expenses', getClientExpenses);
router.get('/expenses/all', getAllExpenses);
router.get('/expenses/stats', getExpenseStats);
router.patch('/expenses/:id', expenseValidation, updateExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;
