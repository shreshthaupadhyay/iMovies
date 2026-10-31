const User = require('../models/User');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateTokens');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email address',
    });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || '',
    role: 'user', // Default role
  });

  // Create welcome notification
  await Notification.create({
    user: user._id,
    message: `Welcome to IMovies, ${user.name}! Enjoy seamless cinema ticket booking.`,
    type: 'system',
  });

  logger.info(`[AUTH] User registered: ${user.email} (${user._id})`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  logger.info(`[AUTH] User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const unreadNotifications = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      unreadNotifications,
    },
  });
});

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;

  if (req.body.currentPassword && req.body.newPassword) {
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// @desc    Logout user (client clears token)
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
};
