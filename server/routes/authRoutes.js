const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules } = require('../middleware/validator');

router.post('/register', authLimiter, registerRules, registerUser);
router.post('/login', authLimiter, loginRules, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', logoutUser);

module.exports = router;
