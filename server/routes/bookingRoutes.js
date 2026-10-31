const express = require('express');
const router = express.Router();
const {
  lockSeatsController,
  unlockSeatsController,
  processPaymentAndBook,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/lock-seats', protect, lockSeatsController);
router.post('/unlock-seats', protect, unlockSeatsController);
router.post('/pay', protect, processPaymentAndBook);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
