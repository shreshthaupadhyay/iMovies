const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    genre: {
      type: [String],
      required: true,
      default: ['Drama'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
    },
    rating: {
      type: Number,
      default: 7.5,
      min: 0,
      max: 10,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    poster: {
      type: String,
      default: 'https://placehold.co/400x600/1e293b/f8fafc?text=Movie+Poster',
    },
    trailerUrl: {
      type: String,
      default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    cast: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['nowShowing', 'upcoming'],
      default: 'nowShowing',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index(
  { title: 'text', description: 'text' },
  { default_language: 'none', language_override: 'none' }
);
movieSchema.index({ genre: 1, language: 1 });
movieSchema.index({ releaseDate: -1 });

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
