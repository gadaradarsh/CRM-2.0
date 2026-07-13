const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getCurrentUser, getEmployees } = require('../controllers/authController');
const { requireAuth, checkRole } = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['manager', 'employee']).withMessage('Role must be manager or employee')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);
router.get('/employees', requireAuth, checkRole('manager'), getEmployees);

// Google OAuth initiation
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

module.exports = router;
