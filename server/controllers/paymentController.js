const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const {
  getPaymentConfig,
  createRazorpayOrder,
} = require('../services/paymentService');

// @desc    Get payment configuration (mock vs razorpay)
// @route   GET /api/payments/config
// @access  Public
const getPaymentConfiguration = asyncHandler(async (req, res) => {
  const config = getPaymentConfig();
  res.json({
    success: true,
    config,
  });
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/razorpay/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { amount, receipt } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required',
    });
  }

  try {
    const order = await createRazorpayOrder({ amount, receipt });
    res.json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// @desc    Get user's payment transactions
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('booking')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: payments.length,
    payments,
  });
});

module.exports = {
  getPaymentConfiguration,
  createOrder,
  getPaymentHistory,
};
