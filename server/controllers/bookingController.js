const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const {
  lockSeats,
  unlockSeats,
  confirmSeatsBooked,
  releaseSeats,
} = require('../services/seatLockService');
const {
  processMockPayment,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} = require('../services/paymentService');

const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'IMV-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Lock seats before payment (5 minute hold)
// @route   POST /api/bookings/lock-seats
// @access  Private
const lockSeatsController = asyncHandler(async (req, res) => {
  const { showId, seatIds } = req.body;

  if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide showId and an array of seatIds to lock',
    });
  }

  if (seatIds.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'You can book a maximum of 10 seats at a time',
    });
  }

  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found',
    });
  }

  if (new Date(show.startTime) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot book seats for a show that has already started or ended',
    });
  }

  const io = req.app.get('io');
  const lockResult = await lockSeats({
    showId,
    seatIds,
    userId: req.user._id,
    io,
  });

  const totalAmount = lockResult.lockedSeats.reduce((acc, s) => acc + s.price, 0);

  res.json({
    success: true,
    message: 'Seats locked successfully for 5 minutes',
    lockExpiresAt: lockResult.lockExpiresAt,
    seats: lockResult.lockedSeats,
    totalAmount,
  });
});

// @desc    Unlock seats (user cancels selection)
// @route   POST /api/bookings/unlock-seats
// @access  Private
const unlockSeatsController = asyncHandler(async (req, res) => {
  const { showId, seatIds } = req.body;

  if (!showId || !seatIds) {
    return res.status(400).json({
      success: false,
      message: 'Please provide showId and seatIds',
    });
  }

  const io = req.app.get('io');
  await unlockSeats({
    showId,
    seatIds,
    userId: req.user._id,
    io,
  });

  res.json({
    success: true,
    message: 'Seats unlocked successfully',
  });
});

// @desc    Process payment and confirm booking
// @route   POST /api/bookings/pay
// @access  Private
const processPaymentAndBook = asyncHandler(async (req, res) => {
  const {
    showId,
    seatIds,
    paymentMethod = 'card',
    forceFail = false,
    cardDetails = {},
    upiId = '',
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = req.body;

  if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Show ID and seat IDs are required',
    });
  }

  const io = req.app.get('io');
  const show = await Show.findById(showId)
    .populate('movie', 'title')
    .populate('theatre', 'name city');

  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found' });
  }

  // Verify that the seats are currently locked by this user and not expired
  const now = new Date();
  const lockedSeats = await Seat.find({
    show: showId,
    seatId: { $in: seatIds },
    status: 'locked',
    lockedBy: req.user._id,
    lockExpiresAt: { $gte: now },
  });

  if (lockedSeats.length !== seatIds.length) {
    // Some seats are not locked by user or lock expired
    return res.status(400).json({
      success: false,
      message: 'Your seat lock has expired or some seats are no longer available. Please select seats again.',
    });
  }

  const totalAmount = lockedSeats.reduce((acc, s) => acc + s.price, 0);
  const bookingCode = generateBookingCode();

  // Process payment
  let paymentResult;
  if (razorpayPaymentId && razorpayOrderId && razorpaySignature && isRazorpayConfigured()) {
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (isValidSignature) {
      paymentResult = {
        success: true,
        status: 'success',
        transactionId: razorpayPaymentId,
        gateway: 'razorpay',
        amount: totalAmount,
        method: paymentMethod,
      };
    } else {
      paymentResult = {
        success: false,
        status: 'failed',
        transactionId: `TXN_FAIL_${Date.now()}`,
        gateway: 'razorpay',
        amount: totalAmount,
        method: paymentMethod,
        reason: 'Razorpay signature verification failed',
      };
    }
  } else {
    // Process Mock Payment
    paymentResult = await processMockPayment({
      amount: totalAmount,
      method: paymentMethod,
      forceFail: Boolean(forceFail),
      details: { upiId, last4: cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : '4242' },
    });
  }

  if (paymentResult.success) {
    // 1. Confirm seats in DB
    await confirmSeatsBooked({
      showId,
      seatIds,
      userId: req.user._id,
      io,
    });

    // 2. Create Booking
    const booking = await Booking.create({
      user: req.user._id,
      show: showId,
      seats: lockedSeats.map((s) => ({
        seatId: s.seatId,
        row: s.row,
        number: s.number,
        tier: s.tier,
        price: s.price,
      })),
      totalAmount,
      status: 'confirmed',
      bookingCode,
    });

    // 3. Save Payment Record
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: totalAmount,
      method: paymentResult.method || paymentMethod,
      status: 'success',
      transactionId: paymentResult.transactionId,
      gateway: paymentResult.gateway || 'mock',
      details: paymentResult.details || {},
    });

    // 4. Create Notification
    await Notification.create({
      user: req.user._id,
      message: `Tickets confirmed for "${show.movie.title}" (${seatIds.join(', ')}) at ${show.theatre.name}. Booking code: ${bookingCode}`,
      type: 'booking',
    });

    logger.info(`[BOOKING] Confirmed: ${bookingCode} for user ${req.user.email}, amount ₹${totalAmount}`);

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster duration language rating' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('user', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: populatedBooking,
      payment,
    });
  } else {
    // Payment failed: release seats
    await releaseSeats({
      showId,
      seatIds,
      io,
    });

    // Save failed booking record
    const failedBooking = await Booking.create({
      user: req.user._id,
      show: showId,
      seats: lockedSeats.map((s) => ({
        seatId: s.seatId,
        row: s.row,
        number: s.number,
        tier: s.tier,
        price: s.price,
      })),
      totalAmount,
      status: 'failed',
      bookingCode,
    });

    // Save failed payment record
    await Payment.create({
      booking: failedBooking._id,
      user: req.user._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'failed',
      transactionId: paymentResult.transactionId,
      gateway: paymentResult.gateway || 'mock',
      details: { reason: paymentResult.reason },
    });

    logger.warn(`[BOOKING] Failed payment for user ${req.user.email}: ${paymentResult.reason}`);

    return res.status(400).json({
      success: false,
      message: paymentResult.reason || 'Payment failed. Your seats have been released.',
      transactionId: paymentResult.transactionId,
    });
  }
});

// @desc    Get user's booking history
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const { tab = 'all' } = req.query;

  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster duration language rating' },
        { path: 'theatre', select: 'name city address' },
      ],
    })
    .sort({ createdAt: -1 });

  const now = new Date();
  let filteredBookings = bookings;

  if (tab === 'upcoming') {
    filteredBookings = bookings.filter(
      (b) => b.status === 'confirmed' && b.show && new Date(b.show.startTime) > now
    );
  } else if (tab === 'past') {
    filteredBookings = bookings.filter(
      (b) => b.status === 'confirmed' && b.show && new Date(b.show.startTime) <= now
    );
  } else if (tab === 'cancelled') {
    filteredBookings = bookings.filter((b) => b.status === 'cancelled');
  }

  res.json({
    success: true,
    count: filteredBookings.length,
    bookings: filteredBookings,
  });
});

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster duration language rating genre' },
        { path: 'theatre', select: 'name city address' },
      ],
    })
    .populate('user', 'name email phone');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Ensure user owns booking or is admin
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this booking',
    });
  }

  const payment = await Payment.findOne({ booking: booking._id });

  res.json({
    success: true,
    booking,
    payment,
  });
});

// @desc    Cancel a booking (> 2 hours before showtime)
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('show');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking',
    });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({
      success: false,
      message: `Booking cannot be cancelled because its status is "${booking.status}"`,
    });
  }

  const showTime = new Date(booking.show.startTime).getTime();
  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (showTime - now < twoHoursMs) {
    return res.status(400).json({
      success: false,
      message: 'Cancellation not allowed. Tickets can only be cancelled at least 2 hours before the show.',
    });
  }

  // Release the booked seats
  const seatIds = booking.seats.map((s) => s.seatId);
  const io = req.app.get('io');
  await releaseSeats({
    showId: booking.show._id,
    seatIds,
    io,
  });

  booking.status = 'cancelled';
  booking.refundedAmount = booking.totalAmount;
  booking.cancellationReason = req.body.reason || 'User requested cancellation';
  await booking.save();

  // Create refund record
  await Payment.create({
    booking: booking._id,
    user: req.user._id,
    amount: booking.totalAmount,
    method: 'wallet',
    status: 'refunded',
    transactionId: `REF_${Date.now()}`,
    gateway: 'mock',
    details: { note: 'Full refund processed to original payment source' },
  });

  // Create notification
  await Notification.create({
    user: req.user._id,
    message: `Your booking ${booking.bookingCode} was cancelled. Full refund of ₹${booking.totalAmount} has been processed.`,
    type: 'cancellation',
  });

  logger.info(`[BOOKING] Cancelled: ${booking.bookingCode}, refund ₹${booking.totalAmount}`);

  res.json({
    success: true,
    message: 'Booking cancelled successfully. Refund of ₹' + booking.totalAmount + ' has been processed.',
    booking,
  });
});

module.exports = {
  lockSeatsController,
  unlockSeatsController,
  processPaymentAndBook,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
