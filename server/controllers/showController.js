const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { releaseExpiredLocks } = require('../services/seatLockService');

// @desc    Get shows with filtering by movie, city, theatre, date
// @route   GET /api/shows
// @access  Public
const getShows = asyncHandler(async (req, res) => {
  const { movie, city, theatre, date } = req.query;
  const query = {};

  if (movie) {
    query.movie = movie;
  }

  if (theatre) {
    query.theatre = theatre;
  } else if (city) {
    const theatresInCity = await Theatre.find({
      city: { $regex: `^${city.trim()}$`, $options: 'i' },
    }).select('_id');
    query.theatre = { $in: theatresInCity.map((t) => t._id) };
  }

  if (date) {
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.startTime = { $gte: startOfDay, $lte: endOfDay };
  }

  const shows = await Show.find(query)
    .populate('movie', 'title duration rating poster language genre')
    .populate('theatre', 'name city address')
    .sort({ startTime: 1 });

  res.json({
    success: true,
    count: shows.length,
    shows,
  });
});

// @desc    Get single show details
// @route   GET /api/shows/:id
// @access  Public
const getShowById = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie')
    .populate('theatre');

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found',
    });
  }

  res.json({
    success: true,
    show,
  });
});

// @desc    Get seats for a show (with live lock check)
// @route   GET /api/shows/:id/seats
// @access  Public (or protected to view own locks)
const getShowSeats = asyncHandler(async (req, res) => {
  const showId = req.params.id;

  const show = await Show.findById(showId)
    .populate('movie', 'title duration rating poster language')
    .populate('theatre', 'name city address');

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found',
    });
  }

  // Release expired locks first for accurate state
  await releaseExpiredLocks();

  const seats = await Seat.find({ show: showId }).sort({ row: 1, number: 1 });

  // Map seats so we mark if locked by the requesting user
  const currentUserId = req.user ? req.user._id.toString() : null;
  const formattedSeats = seats.map((s) => ({
    _id: s._id,
    seatId: s.seatId,
    row: s.row,
    number: s.number,
    tier: s.tier,
    price: s.price,
    status: s.status,
    isMine: currentUserId && s.lockedBy ? s.lockedBy.toString() === currentUserId : false,
    lockExpiresAt: s.lockExpiresAt,
  }));

  res.json({
    success: true,
    show,
    seats: formattedSeats,
    tierPrices: show.prices,
  });
});

// Helper function to auto-generate 120 seats (rows A-J, 12 seats/row)
const generateSeatsForShow = async (showId, prices) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatDocs = [];

  for (const row of rows) {
    let tier = 'Regular';
    let price = prices.regular || 250;

    if (['A', 'B', 'C'].includes(row)) {
      tier = 'Premium';
      price = prices.premium || 350;
    } else if (['I', 'J'].includes(row)) {
      tier = 'Economy';
      price = prices.economy || 150;
    }

    for (let num = 1; num <= 12; num++) {
      seatDocs.push({
        show: showId,
        seatId: `${row}${num}`,
        row,
        number: num,
        tier,
        price,
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
      });
    }
  }

  await Seat.insertMany(seatDocs);
};

// @desc    Create a show with screen overlap check & auto seat generation
// @route   POST /api/shows
// @access  Private/Admin
const createShow = asyncHandler(async (req, res) => {
  const { movie, theatre, screen, startTime, endTime, prices, format, language } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'End time must be after start time',
    });
  }

  // Prevent overlapping shows on the same screen
  const overlapQuery = {
    theatre,
    screen,
    $and: [
      { startTime: { $lt: end } },
      { endTime: { $gt: start } },
    ],
  };

  const overlappingShow = await Show.findOne(overlapQuery);
  if (overlappingShow) {
    return res.status(400).json({
      success: false,
      message: `Overlapping show detected on ${screen} from ${overlappingShow.startTime.toLocaleTimeString()} to ${overlappingShow.endTime.toLocaleTimeString()}`,
    });
  }

  const show = await Show.create({
    movie,
    theatre,
    screen,
    startTime: start,
    endTime: end,
    prices: prices || { premium: 350, regular: 250, economy: 150 },
    format: format || '2D',
    language: language || 'Hindi',
  });

  // Automatically generate seats for the new show
  await generateSeatsForShow(show._id, show.prices);

  logger.info(`[SHOW] Created show: ${show._id} on screen ${show.screen}`);

  const populatedShow = await Show.findById(show._id)
    .populate('movie', 'title duration poster')
    .populate('theatre', 'name city');

  res.status(201).json({
    success: true,
    message: 'Show created and seat layout generated successfully',
    show: populatedShow,
  });
});

// @desc    Update a show
// @route   PUT /api/shows/:id
// @access  Private/Admin
const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found',
    });
  }

  const theatre = req.body.theatre || show.theatre;
  const screen = req.body.screen || show.screen;
  const start = req.body.startTime ? new Date(req.body.startTime) : show.startTime;
  const end = req.body.endTime ? new Date(req.body.endTime) : show.endTime;

  // Overlap check excluding current show
  const overlap = await Show.findOne({
    _id: { $ne: show._id },
    theatre,
    screen,
    $and: [
      { startTime: { $lt: end } },
      { endTime: { $gt: start } },
    ],
  });

  if (overlap) {
    return res.status(400).json({
      success: false,
      message: `Schedule conflict: Screen already occupied by another show during this time`,
    });
  }

  const updatedShow = await Show.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('movie', 'title duration')
    .populate('theatre', 'name city');

  res.json({
    success: true,
    message: 'Show updated successfully',
    show: updatedShow,
  });
});

// @desc    Delete a show & associated seats
// @route   DELETE /api/shows/:id
// @access  Private/Admin
const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found',
    });
  }

  await Show.findByIdAndDelete(req.params.id);
  await Seat.deleteMany({ show: req.params.id });

  logger.info(`[SHOW] Deleted show: ${req.params.id}`);

  res.json({
    success: true,
    message: 'Show and seats deleted successfully',
  });
});

module.exports = {
  getShows,
  getShowById,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
  generateSeatsForShow,
};
