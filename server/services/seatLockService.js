const Seat = require('../models/Seat');
const logger = require('../utils/logger');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired seat locks across the database.
 */
const releaseExpiredLocks = async (ioInstance = null) => {
  try {
    const now = new Date();
    const expiredSeats = await Seat.find({
      status: 'locked',
      lockExpiresAt: { $lt: now },
    });

    if (expiredSeats.length > 0) {
      const showIds = [...new Set(expiredSeats.map((s) => s.show.toString()))];

      await Seat.updateMany(
        {
          _id: { $in: expiredSeats.map((s) => s._id) },
        },
        {
          $set: {
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          },
        }
      );

      logger.info(`[SEAT SERVICE] Released ${expiredSeats.length} expired seat lock(s) across ${showIds.length} show(s).`);

      if (ioInstance) {
        showIds.forEach((showId) => {
          const releasedSeatsForShow = expiredSeats
            .filter((s) => s.show.toString() === showId)
            .map((s) => s.seatId);
          ioInstance.to(`show_${showId}`).emit('seat:released', {
            showId,
            seatIds: releasedSeatsForShow,
          });
        });
      }
    }
    return expiredSeats;
  } catch (err) {
    logger.error(`[SEAT SERVICE] Error releasing expired locks: ${err.message}`);
    return [];
  }
};

/**
 * Atomically lock a list of seats for a given user.
 */
const lockSeats = async ({ showId, seatIds, userId, io = null }) => {
  if (!seatIds || seatIds.length === 0) {
    throw new Error('No seats provided to lock');
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MS);
  const successfullyLocked = [];

  try {
    for (const seatId of seatIds) {
      const lockedSeat = await Seat.findOneAndUpdate(
        {
          show: showId,
          seatId: seatId,
          $or: [
            { status: 'available' },
            { status: 'locked', lockExpiresAt: { $lt: now } },
            { status: 'locked', lockedBy: userId },
          ],
        },
        {
          $set: {
            status: 'locked',
            lockedBy: userId,
            lockExpiresAt: lockExpiresAt,
          },
        },
        { new: true }
      );

      if (!lockedSeat) {
        // Rollback any seats locked so far during this call
        if (successfullyLocked.length > 0) {
          await Seat.updateMany(
            {
              show: showId,
              seatId: { $in: successfullyLocked.map((s) => s.seatId) },
              lockedBy: userId,
            },
            {
              $set: {
                status: 'available',
                lockedBy: null,
                lockExpiresAt: null,
              },
            }
          );
        }
        throw new Error(`Seat ${seatId} is already reserved or booked by another user`);
      }

      successfullyLocked.push(lockedSeat);
    }

    if (io) {
      io.to(`show_${showId}`).emit('seat:lock', {
        showId,
        seatIds,
        lockedBy: userId,
        lockExpiresAt,
      });
    }

    return {
      success: true,
      lockedSeats: successfullyLocked,
      lockExpiresAt,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Atomically unlock a list of seats for a given user.
 */
const unlockSeats = async ({ showId, seatIds, userId, io = null }) => {
  try {
    await Seat.updateMany(
      {
        show: showId,
        seatId: { $in: seatIds },
        lockedBy: userId,
        status: 'locked',
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    if (io) {
      io.to(`show_${showId}`).emit('seat:unlock', {
        showId,
        seatIds,
        userId,
      });
    }

    return { success: true };
  } catch (err) {
    logger.error(`[SEAT SERVICE] Unlock seats error: ${err.message}`);
    throw err;
  }
};

/**
 * Confirm seats as booked upon payment.
 */
const confirmSeatsBooked = async ({ showId, seatIds, userId, io = null }) => {
  const result = await Seat.updateMany(
    {
      show: showId,
      seatId: { $in: seatIds },
    },
    {
      $set: {
        status: 'booked',
        lockedBy: userId,
        lockExpiresAt: null,
      },
    }
  );

  if (io) {
    io.to(`show_${showId}`).emit('seat:booked', {
      showId,
      seatIds,
      bookedBy: userId,
    });
  }

  return result;
};

/**
 * Release seats upon cancellation.
 */
const releaseSeats = async ({ showId, seatIds, io = null }) => {
  const result = await Seat.updateMany(
    {
      show: showId,
      seatId: { $in: seatIds },
    },
    {
      $set: {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
      },
    }
  );

  if (io) {
    io.to(`show_${showId}`).emit('seat:released', {
      showId,
      seatIds,
    });
  }

  return result;
};

let cleanupInterval = null;
const startSeatCleanupJob = (ioInstance) => {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = setInterval(() => {
    releaseExpiredLocks(ioInstance);
  }, 15000); // Check every 15 seconds
};

const stopSeatCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

module.exports = {
  releaseExpiredLocks,
  lockSeats,
  unlockSeats,
  confirmSeatsBooked,
  releaseSeats,
  startSeatCleanupJob,
  stopSeatCleanupJob,
};
