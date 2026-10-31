import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TrailerModal from './TrailerModal';

const MovieCard = ({ movie }) => {
  const [showTrailer, setShowTrailer] = useState(false);

  const isNowShowing = movie.status === 'nowShowing';

  return (
    <>
      <div className="card cinema-card h-100 text-white overflow-hidden d-flex flex-column">
        {/* Poster Box */}
        <div className="movie-poster-box position-relative">
          <img
            src={movie.poster || 'https://placehold.co/400x600/1e293b/f8fafc?text=No+Poster'}
            alt={movie.title}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x600/1e293b/f8fafc?text=Movie';
            }}
          />

          {/* Rating Badge */}
          {movie.rating > 0 && (
            <div
              className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded d-flex align-items-center gap-1 shadow-sm"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <i className="bi bi-star-fill text-warning"></i>
              <span>{movie.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Language Badge */}
          <div
            className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded shadow-sm text-uppercase"
            style={{
              backgroundColor: 'rgba(229, 9, 20, 0.85)',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            {movie.language}
          </div>

          {/* Quick Trailer Button on Hover */}
          {movie.trailerUrl && (
            <button
              onClick={() => setShowTrailer(true)}
              className="btn btn-sm btn-dark position-absolute bottom-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{ width: '36px', height: '36px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
              title="Watch Trailer"
            >
              <i className="bi bi-play-fill text-danger fs-5 ms-0.5"></i>
            </button>
          )}
        </div>

        {/* Card Content */}
        <div className="card-body p-3 d-flex flex-column flex-grow-1 justify-content-between">
          <div>
            <h6 className="card-title fw-bold text-white mb-1 text-truncate" title={movie.title}>
              {movie.title}
            </h6>

            <div className="d-flex align-items-center gap-2 mb-2 text-muted small" style={{ fontSize: '0.78rem' }}>
              <span>{movie.duration} min</span>
              <span>•</span>
              <span className="text-truncate">
                {Array.isArray(movie.genre) ? movie.genre.slice(0, 2).join(', ') : movie.genre}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to={`/movie/${movie._id}`}
              className={`btn btn-sm w-100 fw-semibold ${
                isNowShowing ? 'btn-cinema' : 'btn-cinema-outline'
              }`}
            >
              {isNowShowing ? (
                <>
                  <i className="bi bi-ticket-perforated-fill me-1"></i> Book Tickets
                </>
              ) : (
                <>
                  <i className="bi bi-info-circle me-1"></i> View Details
                </>
              )}
            </Link>
          </div>
        </div>
      </div>

      <TrailerModal
        show={showTrailer}
        onHide={() => setShowTrailer(false)}
        title={movie.title}
        trailerUrl={movie.trailerUrl}
      />
    </>
  );
};

export default MovieCard;
