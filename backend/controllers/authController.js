const User = require('../models/User');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });
    if (!user.password) return res.status(401).json({ success: false, message: 'Please use Google login for this account' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role };
    res.json({
      success: true,
      message: 'Login successful',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Could not log out' });
    res.clearCookie('crm.session');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

const getCurrentUser = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, user: req.session.user });
};

const getEmployees = async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Manager role required' });
    }
    const employees = await User.find({ role: 'employee', isActive: true })
      .select('_id name email')
      .sort({ name: 1 });
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Google OAuth initiation
const googleAuth = (passport) => {
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false });
};

module.exports = { register, login, logout, getCurrentUser, getEmployees, googleAuth };
