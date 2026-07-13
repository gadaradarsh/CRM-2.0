const express = require('express');
const { body } = require('express-validator');
const { getClients, getClient, createClient, updateClient, deleteClient, assignClient, updateStatus } = require('../controllers/clientController');
const { requireAuth, checkRole, checkClientAccess } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const clientValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').trim().isLength({ min: 7 }).withMessage('Valid phone number required'),
  body('company').trim().isLength({ min: 2 }).withMessage('Company name required'),
  body('estimatedValue').optional().isNumeric().withMessage('Estimated value must be a number')
];

router.get('/', getClients);
router.get('/:id', checkClientAccess, getClient);
router.post('/', clientValidation, createClient);
router.patch('/:id', checkClientAccess, clientValidation, updateClient);
router.delete('/:id', checkClientAccess, deleteClient);
router.patch('/:id/assign', checkRole('manager'), body('assignedTo').isMongoId(), assignClient);
router.patch('/:id/status', checkClientAccess, body('status').isIn(['new','contacted','qualified','won','lost']), updateStatus);

module.exports = router;
