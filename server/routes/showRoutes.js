const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowById,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { showRules } = require('../middleware/validator');

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', optionalAuth, getShowSeats);

router.post('/', protect, adminOnly, showRules, createShow);
router.put('/:id', protect, adminOnly, updateShow);
router.delete('/:id', protect, adminOnly, deleteShow);

module.exports = router;
