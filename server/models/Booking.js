const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  row: { type: String },
  number: { type: Number },
  tier: { type: String, enum: ['Premium', 'Regular', 'Economy'] },
  price: { type: Number, required: true },
});

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seats: [bookingSeatSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
