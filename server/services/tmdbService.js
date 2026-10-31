const axios = require('axios');
const logger = require('../utils/logger');
const Movie = require('../models/Movie');

const isTmdbConfigured = () => {
  return Boolean(process.env.TMDB_API_KEY && process.env.TMDB_API_KEY.trim().length > 0);
};

const genreMap = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const importFromTmdb = async (page = 1) => {
  if (!isTmdbConfigured()) {
    throw new Error('TMDB_API_KEY is not configured in server environment');
  }

  const apiKey = process.env.TMDB_API_KEY.trim();
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=${page}`;

  logger.info(`[TMDB] Fetching now playing movies from TMDB...`);
  const response = await axios.get(url);
  const results = response.data.results || [];

  const imported = [];
  for (const item of results) {
    const existing = await Movie.findOne({ title: item.title });
    if (!existing) {
      const genres = (item.genre_ids || []).map((id) => genreMap[id] || 'Drama');
      const newMovie = await Movie.create({
        title: item.title,
        description: item.overview || 'No overview provided.',
        genre: genres.length > 0 ? genres : ['Action', 'Drama'],
        language: item.original_language === 'hi' ? 'Hindi' : 'English',
        duration: 120 + Math.floor(Math.random() * 40),
        rating: Math.round((item.vote_average || 7.0) * 10) / 10,
        releaseDate: item.release_date ? new Date(item.release_date) : new Date(),
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : 'https://placehold.co/400x600/1e293b/f8fafc?text=Movie+Poster',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        cast: ['Lead Actor', 'Supporting Actor'],
        status: 'nowShowing',
      });
      imported.push(newMovie);
    }
  }

  logger.info(`[TMDB] Successfully imported ${imported.length} new movies from TMDB`);
  return {
    totalFetched: results.length,
    totalImported: imported.length,
    movies: imported,
  };
};

module.exports = {
  isTmdbConfigured,
  importFromTmdb,
};
