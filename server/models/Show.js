const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    screen: {
      type: String,
      required: true,
      default: 'Screen 1',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    prices: {
      premium: { type: Number, default: 350 },
      regular: { type: Number, default: 250 },
      economy: { type: Number, default: 150 },
    },
    format: {
      type: String,
      enum: ['2D', '3D', '4DX', 'IMAX 2D', 'IMAX 3D'],
      default: '2D',
    },
    language: {
      type: String,
      default: 'Hindi',
    },
  },
  {
    timestamps: true,
  }
);

showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, startTime: 1 });
showSchema.index({ theatre: 1, screen: 1, startTime: 1 });

const Show = mongoose.model('Show', showSchema);
module.exports = Show;
