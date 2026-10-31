const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// @desc    Get all theatres (optionally filter by city)
// @route   GET /api/theatres
// @access  Public
const getTheatres = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const query = {};

  if (city && city !== 'all') {
    query.city = { $regex: `^${city.trim()}$`, $options: 'i' };
  }

  const theatres = await Theatre.find(query).sort({ city: 1, name: 1 });

  res.json({
    success: true,
    count: theatres.length,
    theatres,
  });
});

// @desc    Get single theatre
// @route   GET /api/theatres/:id
// @access  Public
const getTheatreById = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) {
    return res.status(404).json({
      success: false,
      message: 'Theatre not found',
    });
  }

  res.json({
    success: true,
    theatre,
  });
});

// @desc    Create a theatre (Admin)
// @route   POST /api/theatres
// @access  Private/Admin
const createTheatre = asyncHandler(async (req, res) => {
  const { name, city, address, screens } = req.body;

  if (!name || !city || !address) {
    return res.status(400).json({
      success: false,
      message: 'Name, city, and address are required',
    });
  }

  const defaultScreens = [
    { name: 'Audi 1 (Dolby Atmos)', rows: 10, seatsPerRow: 12 },
    { name: 'Audi 2 (4K Laser)', rows: 10, seatsPerRow: 12 },
  ];

  const theatre = await Theatre.create({
    name,
    city,
    address,
    screens: screens && screens.length > 0 ? screens : defaultScreens,
  });

  logger.info(`[THEATRE] Created theatre: ${theatre.name} in ${theatre.city} (${theatre._id})`);

  res.status(201).json({
    success: true,
    message: 'Theatre created successfully',
    theatre,
  });
});

// @desc    Update a theatre (Admin)
// @route   PUT /api/theatres/:id
// @access  Private/Admin
const updateTheatre = asyncHandler(async (req, res) => {
  let theatre = await Theatre.findById(req.params.id);
  if (!theatre) {
    return res.status(404).json({
      success: false,
      message: 'Theatre not found',
    });
  }

  theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: 'Theatre updated successfully',
    theatre,
  });
});

// @desc    Delete a theatre (Admin)
// @route   DELETE /api/theatres/:id
// @access  Private/Admin
const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) {
    return res.status(404).json({
      success: false,
      message: 'Theatre not found',
    });
  }

  await Theatre.findByIdAndDelete(req.params.id);
  await Show.deleteMany({ theatre: req.params.id });

  logger.info(`[THEATRE] Deleted theatre: ${theatre.name} (${theatre._id})`);

  res.json({
    success: true,
    message: 'Theatre deleted successfully',
  });
});

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
