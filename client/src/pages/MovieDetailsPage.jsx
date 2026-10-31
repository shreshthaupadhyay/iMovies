import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMovieById } from '../redux/slices/movieSlice';
import API from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TrailerModal from '../components/TrailerModal';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedMovie, isLoading, error } = useSelector((state) => state.movies);
  const { filters } = useSelector((state) => state.movies);

  const [shows, setShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // Selected date (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Generate 7 upcoming dates
  const next7Days = [];
  const baseDate = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    next7Days.push({ dateStr, dayName, dayNum, monthName });
  }

  useEffect(() => {
    dispatch(fetchMovieById(id));
  }, [dispatch, id]);

  useEffect(() => {
    const loadShows = async () => {
      setLoadingShows(true);
      try {
        const res = await API.get('/shows', {
          params: {
            movie: id,
            city: filters.city || 'Bhopal',
            date: selectedDate,
          },
        });
        setShows(res.data.shows || []);
      } catch (err) {
        console.error('Failed to load shows', err);
      } finally {
        setLoadingShows(false);
      }
    };

    if (id) {
      loadShows();
    }
  }, [id, filters.city, selectedDate]);

  if (isLoading) return <LoadingSpinner message="Loading movie details..." />;
  if (error || !selectedMovie) return <ErrorMessage message={error || 'Movie not found'} />;

  // Group shows by Theatre
  const theatreMap = {};
  shows.forEach((show) => {
    const tId = show.theatre?._id;
    if (!tId) return;
    if (!theatreMap[tId]) {
      theatreMap[tId] = {
        theatre: show.theatre,
        shows: [],
      };
    }
    theatreMap[tId].shows.push(show);
  });
  const theatresList = Object.values(theatreMap);

  return (
    <div>
      {/* Hero Banner Header */}
      <div
        className="position-relative py-5"
        style={{
          backgroundColor: '#0c1220',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="container">
          <div className="row g-4 align-items-center">
            {/* Poster */}
            <div className="col-12 col-md-4 col-lg-3 text-center">
              <img
                src={selectedMovie.poster}
                alt={selectedMovie.title}
                className="img-fluid rounded-4 shadow-lg border border-secondary border-opacity-25"
                style={{ maxHeight: '420px', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge bg-danger text-uppercase px-3 py-2 fs-6">
                  {selectedMovie.language}
                </span>
                <span className="badge bg-secondary bg-opacity-50 px-3 py-2 fs-6">
                  {selectedMovie.duration} mins
                </span>
                <span className="badge bg-dark border border-secondary px-3 py-2 fs-6">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  {selectedMovie.rating ? selectedMovie.rating.toFixed(1) : '7.5'} / 10
                </span>
                <span className="badge bg-info bg-opacity-25 text-info px-3 py-2 fs-6">
                  {selectedMovie.status === 'nowShowing' ? 'Now Showing' : 'Upcoming Release'}
                </span>
              </div>

              <h1 className="display-4 fw-extrabold text-white mb-2">{selectedMovie.title}</h1>

              <div className="text-secondary mb-3 fs-5">
                {Array.isArray(selectedMovie.genre) ? selectedMovie.genre.join(' • ') : selectedMovie.genre}
              </div>

              <p className="lead text-light text-opacity-75 mb-4" style={{ maxWidth: '780px' }}>
                {selectedMovie.description}
              </p>

              {/* Cast */}
              {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                <div className="mb-4">
                  <div className="text-secondary small fw-bold text-uppercase mb-2">Cast & Crew</div>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedMovie.cast.map((actor, idx) => (
                      <span key={idx} className="badge bg-dark border border-secondary text-light px-2 py-1">
                        <i className="bi bi-person me-1"></i> {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Watch Trailer Button */}
              {selectedMovie.trailerUrl && (
                <button onClick={() => setShowTrailer(true)} className="btn btn-cinema px-4 py-2">
                  <i className="bi bi-play-circle-fill me-2 fs-5 align-middle"></i>
                  Watch Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Bar */}
      <div className="py-3 sticky-top" style={{ backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container">
          <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1">
            <span className="text-secondary small fw-bold text-uppercase me-2 d-none d-md-inline">
              <i className="bi bi-calendar3 me-1"></i> Date:
            </span>
            {next7Days.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`btn btn-sm text-center px-3 py-2 rounded-3 border-0 transition ${
                  selectedDate === d.dateStr ? 'btn-danger text-white fw-bold shadow' : 'btn-dark text-light border'
                }`}
                style={{ minWidth: '76px' }}
              >
                <div style={{ fontSize: '0.7rem' }}>{d.dayName}</div>
                <div className="fs-5 fw-bold">{d.dayNum}</div>
                <div style={{ fontSize: '0.65rem' }}>{d.monthName}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theatres & Showtimes Section */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-white mb-0">
            Available Shows in <span className="text-danger">{filters.city || 'Bhopal'}</span>
          </h4>
          <span className="text-muted small">
            {theatresList.length} theatres showing on{' '}
            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {loadingShows ? (
          <LoadingSpinner message="Searching showtimes across cinema halls..." />
        ) : theatresList.length === 0 ? (
          <div className="text-center py-5 cinema-card-plain p-4 rounded-4 my-3">
            <i className="bi bi-calendar-x text-secondary display-4 mb-3 d-block"></i>
            <h5 className="text-white fw-bold">No shows available for this date</h5>
            <p className="text-muted small">
              Try selecting another date or check other nearby cities from the city selector.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {theatresList.map(({ theatre, shows: tShows }) => (
              <div key={theatre._id} className="cinema-card-plain p-4 rounded-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                  <div>
                    <h5 className="fw-bold text-white mb-1">
                      <i className="bi bi-building text-danger me-2"></i>
                      {theatre.name}
                    </h5>
                    <div className="text-secondary small">{theatre.address}</div>
                  </div>
                  <div className="text-muted small mt-2 mt-md-0">
                    <span className="badge bg-secondary bg-opacity-25 text-light me-1">M-Ticket</span>
                    <span className="badge bg-secondary bg-opacity-25 text-light">Food & Beverage</span>
                  </div>
                </div>

                {/* Showtimes Pills */}
                <div className="d-flex flex-wrap gap-3 pt-2">
                  {tShows.map((s) => {
                    const timeStr = new Date(s.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <Link
                        key={s._id}
                        to={`/booking/${s._id}`}
                        className="btn btn-outline-success text-center px-3 py-2 rounded-3 text-decoration-none transition"
                        style={{ minWidth: '105px' }}
                      >
                        <div className="fw-bold fs-6">{timeStr}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                          {s.format || '2D'} • {s.screen}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        show={showTrailer}
        onHide={() => setShowTrailer(false)}
        title={selectedMovie.title}
        trailerUrl={selectedMovie.trailerUrl}
      />
    </div>
  );
};

export default MovieDetailsPage;
