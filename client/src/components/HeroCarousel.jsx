import React, { useState } from 'react';
import { Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import TrailerModal from './TrailerModal';

const HeroCarousel = ({ movies = [] }) => {
  const [activeTrailer, setActiveTrailer] = useState(null);

  if (!movies || movies.length === 0) return null;

  // Pick top 4 movies for carousel
  const carouselMovies = movies.slice(0, 4);

  return (
    <>
      <div className="mb-5">
        <Carousel indicators={true} controls={true} interval={5500} fade className="rounded-4 overflow-hidden">
          {carouselMovies.map((movie) => (
            <Carousel.Item key={movie._id}>
              <div
                className="hero-backdrop"
                style={{
                  backgroundImage: `url(${movie.poster})`,
                }}
              >
                <div className="hero-overlay">
                  <div className="container px-0" style={{ maxWidth: '650px' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-danger text-uppercase">{movie.language}</span>
                      <span className="badge bg-dark border border-secondary">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        {movie.rating ? movie.rating.toFixed(1) : '7.5'} / 10
                      </span>
                      <span className="badge bg-secondary bg-opacity-50">
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}
                      </span>
                    </div>

                    <h1 className="display-5 fw-extrabold text-white mb-2 tracking-tight">
                      {movie.title}
                    </h1>

                    <p className="lead text-light text-opacity-75 mb-4 line-clamp-2" style={{ fontSize: '0.98rem' }}>
                      {movie.description}
                    </p>

                    <div className="d-flex align-items-center gap-3">
                      <Link to={`/movie/${movie._id}`} className="btn btn-cinema px-4 py-2">
                        <i className="bi bi-ticket-perforated-fill me-2"></i> Book Tickets
                      </Link>

                      {movie.trailerUrl && (
                        <button
                          onClick={() => setActiveTrailer(movie)}
                          className="btn btn-cinema-outline px-3 py-2"
                        >
                          <i className="bi bi-play-circle me-1"></i> Watch Trailer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {activeTrailer && (
        <TrailerModal
          show={Boolean(activeTrailer)}
          onHide={() => setActiveTrailer(null)}
          title={activeTrailer.title}
          trailerUrl={activeTrailer.trailerUrl}
        />
      )}
    </>
  );
};

export default HeroCarousel;
