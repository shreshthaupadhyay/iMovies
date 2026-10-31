const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    tier: {
      type: String,
      enum: ['Premium', 'Regular', 'Economy'],
      default: 'Regular',
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
      index: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index({ show: 1, status: 1 });
seatSchema.index({ show: 1, seatId: 1 }, { unique: true });
seatSchema.index({ lockExpiresAt: 1 });

const Seat = mongoose.model('Seat', seatSchema);
module.exports = Seat;
