const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllBookings,
  getAllUsers,
  updateUserRole,
  triggerTmdbImport,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.post('/tmdb/import', triggerTmdbImport);

module.exports = router;
