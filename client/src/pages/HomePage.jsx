import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMovies, fetchFilterOptions, setPage } from '../redux/slices/movieSlice';
import HeroCarousel from '../components/HeroCarousel';
import FilterBar from '../components/FilterBar';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Pagination } from 'react-bootstrap';

const HomePage = () => {
  const dispatch = useDispatch();
  const { movies, total, totalPages, currentPage, filters, isLoading, error } = useSelector(
    (state) => state.movies
  );

  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMovies(filters));
  }, [dispatch, filters]);

  const handlePageChange = (page) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="container py-4">
      {/* Hero Carousel with Top Rated Now Showing Movies */}
      <HeroCarousel movies={movies.filter((m) => m.status === 'nowShowing')} />

      {/* Main Movie Listing Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-extrabold text-white mb-1">
            {filters.status === 'upcoming' ? 'Coming Soon' : 'Movies in Cinemas'}
          </h3>
          <p className="text-secondary small mb-0">
            Showing movies in <span className="text-danger fw-bold">{filters.city || 'Bhopal'}</span> • {total} total titles
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Movie Grid */}
      {isLoading ? (
        <LoadingSpinner message="Fetching cinema listings..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => dispatch(fetchMovies(filters))} />
      ) : movies.length === 0 ? (
        <div className="text-center py-5 cinema-card-plain p-4 rounded-4 my-4">
          <i className="bi bi-film text-secondary display-3 mb-3 d-block"></i>
          <h5 className="text-white fw-bold">No movies found</h5>
          <p className="text-muted small">
            No movies match your current search and filter selections in {filters.city}.
          </p>
        </div>
      ) : (
        <>
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4 mb-5">
            {movies.map((movie) => (
              <div key={movie._id} className="col">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center my-4">
              <Pagination className="pagination-dark">
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
