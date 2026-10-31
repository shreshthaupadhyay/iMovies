const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const path = require('path');

// @desc    Get all movies with search, filter, sort, and pagination
// @route   GET /api/movies
// @access  Public
const getMovies = asyncHandler(async (req, res) => {
  const {
    search,
    genre,
    language,
    status,
    city,
    theatre,
    date,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const query = {};

  // Text search on title
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // Genre filter
  if (genre && genre !== 'all') {
    const genres = genre.split(',').map((g) => g.trim());
    query.genre = { $in: genres };
  }

  // Language filter
  if (language && language !== 'all') {
    const languages = language.split(',').map((l) => l.trim());
    query.language = { $in: languages };
  }

  // Status filter (nowShowing / upcoming)
  if (status && status !== 'all') {
    query.status = status;
  }

  // Filter by city, theatre, or date by joining with Shows
  let movieIdsFromShows = null;
  if (city || theatre || date) {
    const showQuery = {};

    if (theatre) {
      showQuery.theatre = theatre;
    } else if (city) {
      const theatresInCity = await Theatre.find({ city: { $regex: `^${city.trim()}$`, $options: 'i' } }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      showQuery.theatre = { $in: theatreIds };
    }

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      showQuery.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const matchingShows = await Show.find(showQuery).distinct('movie');
    movieIdsFromShows = matchingShows;
    query._id = { $in: movieIdsFromShows };
  }

  // Sorting
  let sortOption = { releaseDate: -1 };
  if (sort === 'rating_desc') {
    sortOption = { rating: -1 };
  } else if (sort === 'rating_asc') {
    sortOption = { rating: 1 };
  } else if (sort === 'title_asc') {
    sortOption = { title: 1 };
  } else if (sort === 'release_asc') {
    sortOption = { releaseDate: 1 };
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const total = await Movie.countDocuments(query);
  const movies = await Movie.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    count: movies.length,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
    currentPage: pageNum,
    movies,
  });
});

// @desc    Get single movie details
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found',
    });
  }

  res.json({
    success: true,
    movie,
  });
});

// @desc    Get filter options (genres, languages, cities)
// @route   GET /api/movies/filters/options
// @access  Public
const getFilterOptions = asyncHandler(async (req, res) => {
  const allGenres = await Movie.distinct('genre');
  const allLanguages = await Movie.distinct('language');
  const allCities = await Theatre.distinct('city');

  res.json({
    success: true,
    genres: allGenres.filter(Boolean).sort(),
    languages: allLanguages.filter(Boolean).sort(),
    cities: allCities.filter(Boolean).sort(),
  });
});

// @desc    Create a movie (Admin)
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    genre,
    language,
    duration,
    rating,
    releaseDate,
    poster,
    trailerUrl,
    cast,
    status,
  } = req.body;

  let posterPath = poster;
  if (req.file) {
    posterPath = `/uploads/${req.file.filename}`;
  }

  // Parse genre if sent as JSON string or comma-separated
  let parsedGenre = genre;
  if (typeof genre === 'string') {
    try {
      parsedGenre = JSON.parse(genre);
    } catch {
      parsedGenre = genre.split(',').map((g) => g.trim());
    }
  }

  // Parse cast if sent as string
  let parsedCast = cast;
  if (typeof cast === 'string') {
    try {
      parsedCast = JSON.parse(cast);
    } catch {
      parsedCast = cast.split(',').map((c) => c.trim());
    }
  }

  const movie = await Movie.create({
    title,
    description,
    genre: Array.isArray(parsedGenre) ? parsedGenre : ['Drama'],
    language,
    duration: Number(duration) || 120,
    rating: Number(rating) || 7.5,
    releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
    poster: posterPath || 'https://placehold.co/400x600/1e293b/f8fafc?text=Movie+Poster',
    trailerUrl: trailerUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cast: Array.isArray(parsedCast) ? parsedCast : [],
    status: status || 'nowShowing',
  });

  logger.info(`[MOVIE] Created movie: ${movie.title} (${movie._id})`);

  res.status(201).json({
    success: true,
    message: 'Movie created successfully',
    movie,
  });
});

// @desc    Update a movie (Admin)
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
  let movie = await Movie.findById(req.params.id);
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found',
    });
  }

  const updateData = { ...req.body };

  if (req.file) {
    updateData.poster = `/uploads/${req.file.filename}`;
  }

  if (typeof updateData.genre === 'string') {
    try {
      updateData.genre = JSON.parse(updateData.genre);
    } catch {
      updateData.genre = updateData.genre.split(',').map((g) => g.trim());
    }
  }

  if (typeof updateData.cast === 'string') {
    try {
      updateData.cast = JSON.parse(updateData.cast);
    } catch {
      updateData.cast = updateData.cast.split(',').map((c) => c.trim());
    }
  }

  movie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  logger.info(`[MOVIE] Updated movie: ${movie.title} (${movie._id})`);

  res.json({
    success: true,
    message: 'Movie updated successfully',
    movie,
  });
});

// @desc    Delete a movie (Admin)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found',
    });
  }

  await Movie.findByIdAndDelete(req.params.id);
  // Also clean up shows for this movie
  await Show.deleteMany({ movie: req.params.id });

  logger.info(`[MOVIE] Deleted movie: ${movie.title} (${req.params.id})`);

  res.json({
    success: true,
    message: 'Movie and associated shows deleted successfully',
  });
});

module.exports = {
  getMovies,
  getMovieById,
  getFilterOptions,
  createMovie,
  updateMovie,
  deleteMovie,
};
