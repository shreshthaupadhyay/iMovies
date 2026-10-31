const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { isTmdbConfigured, importFromTmdb } = require('../services/tmdbService');

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalMovies, totalTheatres, totalShows, totalBookings] =
    await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments(),
    ]);

  // Total confirmed revenue
  const revenueAggregation = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

  // Bookings per day for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const bookingsDaily = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
        status: { $in: ['confirmed', 'cancelled'] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalAmount', 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in any missing days in the 7-day range
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = bookingsDaily.find((item) => item._id === dateStr);
    chartData.push({
      date: dateStr,
      bookings: found ? found.count : 0,
      revenue: found ? found.revenue : 0,
    });
  }

  // Recent 5 bookings
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title' },
        { path: 'theatre', select: 'name city' },
      ],
    });

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalMovies,
      totalTheatres,
      totalShows,
      totalBookings,
      totalRevenue,
    },
    chartData,
    recentBookings,
    tmdbAvailable: isTmdbConfigured(),
  });
});

// @desc    Get all bookings (Admin)
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate('user', 'name email phone')
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster' },
        { path: 'theatre', select: 'name city address' },
      ],
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
    currentPage: pageNum,
    bookings,
  });
});

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments();
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
    currentPage: pageNum,
    users,
  });
});

// @desc    Update user role (Admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    user,
  });
});

// @desc    Trigger TMDB movie import (Admin)
// @route   POST /api/admin/tmdb/import
// @access  Private/Admin
const triggerTmdbImport = asyncHandler(async (req, res) => {
  try {
    const result = await importFromTmdb(req.body.page || 1);
    res.json({
      success: true,
      message: `Successfully imported ${result.totalImported} movies from TMDB`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = {
  getAdminStats,
  getAllBookings,
  getAllUsers,
  updateUserRole,
  triggerTmdbImport,
};
