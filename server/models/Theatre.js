const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rows: {
    type: Number,
    required: true,
    default: 10, // A to J
  },
  seatsPerRow: {
    type: Number,
    required: true,
    default: 12, // 1 to 12
  },
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    screens: [screenSchema],
  },
  {
    timestamps: true,
  }
);

theatreSchema.index({ city: 1, name: 1 });

const Theatre = mongoose.model('Theatre', theatreSchema);
module.exports = Theatre;
