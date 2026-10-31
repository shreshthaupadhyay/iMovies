const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { lockSeats, unlockSeats } = require('../services/seatLockService');

const initSeatSocket = (io) => {
  // Socket JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback_secret_imovies_production_64char_key_super_secure'
        );
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.user = user;
        }
      }
      // Allow guest connections too for live seat availability view
      next();
    } catch (err) {
      // Allow connection even if token fails, but without socket.user
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[SOCKET] Client connected: ${socket.id} (User: ${socket.user ? socket.user.email : 'Guest'})`);

    // Join show room for real-time seat sync
    socket.on('join:show', ({ showId }) => {
      if (showId) {
        const roomName = `show_${showId}`;
        socket.join(roomName);
        logger.info(`[SOCKET] ${socket.id} joined room ${roomName}`);
      }
    });

    // Leave show room
    socket.on('leave:show', ({ showId }) => {
      if (showId) {
        const roomName = `show_${showId}`;
        socket.leave(roomName);
        logger.info(`[SOCKET] ${socket.id} left room ${roomName}`);
      }
    });

    // Seat lock event from socket client
    socket.on('seat:lock', async ({ showId, seatIds }, callback) => {
      if (!socket.user) {
        if (callback) callback({ success: false, message: 'Authentication required to lock seats' });
        return;
      }

      try {
        const result = await lockSeats({
          showId,
          seatIds,
          userId: socket.user._id,
          io,
        });
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Seat unlock event from socket client
    socket.on('seat:unlock', async ({ showId, seatIds }, callback) => {
      if (!socket.user) {
        if (callback) callback({ success: false, message: 'Authentication required' });
        return;
      }

      try {
        await unlockSeats({
          showId,
          seatIds,
          userId: socket.user._id,
          io,
        });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSeatSocket;
