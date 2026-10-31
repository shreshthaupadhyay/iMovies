const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  getFilterOptions,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { movieRules } = require('../middleware/validator');

router.get('/filters/options', getFilterOptions);
router.get('/', getMovies);
router.get('/:id', getMovieById);

router.post(
  '/',
  protect,
  adminOnly,
  upload.single('poster'),
  movieRules,
  createMovie
);

router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('poster'),
  updateMovie
);

router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;
