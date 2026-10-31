const crypto = require('crypto');
const logger = require('../utils/logger');

let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (e) {
  // Razorpay module optional
}

const isRazorpayConfigured = () => {
  return Boolean(
    Razorpay &&
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID.trim().length > 0 &&
    process.env.RAZORPAY_KEY_SECRET.trim().length > 0
  );
};

let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (isRazorpayConfigured()) {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance;
  }
  return null;
};

const processMockPayment = async ({ amount, method = 'card', forceFail = false, details = {} }) => {
  // Artificial 600ms latency to simulate real network roundtrip
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (forceFail) {
    logger.warn(`[PAYMENT SERVICE] Mock payment forcibly failed for amount ₹${amount}`);
    return {
      success: false,
      status: 'failed',
      transactionId: `TXN_FAIL_${Date.now()}`,
      gateway: 'mock',
      amount,
      method,
      reason: 'Forced payment failure (User test simulation)',
    };
  }

  // 92% success rate
  const isSuccessful = Math.random() < 0.92;

  if (isSuccessful) {
    const txId = `TXN_MOCK_${Math.random().toString(36).substring(2, 9).toUpperCase()}_${Date.now()}`;
    logger.info(`[PAYMENT SERVICE] Mock payment successful: ${txId} for ₹${amount}`);
    return {
      success: true,
      status: 'success',
      transactionId: txId,
      gateway: 'mock',
      amount,
      method,
      details,
    };
  } else {
    logger.warn(`[PAYMENT SERVICE] Mock payment random decline for ₹${amount}`);
    return {
      success: false,
      status: 'failed',
      transactionId: `TXN_FAIL_${Date.now()}`,
      gateway: 'mock',
      amount,
      method,
      reason: 'Simulated payment decline: Card issuer timeout or insufficient balance',
    };
  }
};

const createRazorpayOrder = async ({ amount, receipt }) => {
  const rzp = getRazorpayInstance();
  if (!rzp) {
    throw new Error('Razorpay is not configured on this server');
  }

  const options = {
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: receipt || `receipt_${Date.now()}`,
    payment_capture: 1,
  };

  const order = await rzp.orders.create(options);
  return order;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
};

const getPaymentConfig = () => ({
  razorpayAvailable: isRazorpayConfigured(),
  razorpayKeyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
});

module.exports = {
  isRazorpayConfigured,
  processMockPayment,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getPaymentConfig,
};
