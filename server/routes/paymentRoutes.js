const express = require('express');
const router = express.Router();
const {
  getPaymentConfiguration,
  createOrder,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/config', getPaymentConfiguration);
router.post('/razorpay/create-order', protect, createOrder);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
