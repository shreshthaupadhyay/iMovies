import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFilter, resetFilters } from '../redux/slices/movieSlice';

const FilterBar = () => {
  const dispatch = useDispatch();
  const { filters, filterOptions } = useSelector((state) => state.movies);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ [key]: value }));
  };

  // Generate date options for the next 7 days
  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Tomorrow'
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    dateOptions.push({ value: dateStr, label });
  }

  return (
    <div
      className="p-3 mb-4 rounded-3 cinema-card-plain"
      style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <div className="row g-3 align-items-center">
        {/* Status Tabs (Now Showing vs Upcoming) */}
        <div className="col-12 col-md-auto">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${
                filters.status === 'nowShowing' ? 'btn-danger' : 'btn-dark text-muted border-secondary'
              }`}
              onClick={() => handleFilterChange('status', 'nowShowing')}
            >
              <i className="bi bi-film me-1"></i> Now Showing
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                filters.status === 'upcoming' ? 'btn-danger' : 'btn-dark text-muted border-secondary'
              }`}
              onClick={() => handleFilterChange('status', 'upcoming')}
            >
              <i className="bi bi-clock-history me-1"></i> Upcoming
            </button>
          </div>
        </div>

        {/* Genre Selector */}
        <div className="col-6 col-sm-4 col-md-2">
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="all">All Genres</option>
            {filterOptions.genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selector */}
        <div className="col-6 col-sm-4 col-md-2">
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
          >
            <option value="all">All Languages</option>
            {filterOptions.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="col-6 col-sm-4 col-md-2">
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          >
            <option value="">Any Date</option>
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="col-6 col-sm-6 col-md-2">
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="rating_desc">Highest Rated</option>
            <option value="rating_asc">Lowest Rated</option>
            <option value="release_desc">Newest Release</option>
            <option value="title_asc">Title (A - Z)</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="col-12 col-sm-6 col-md-auto ms-auto text-end">
          <button
            onClick={() => dispatch(resetFilters())}
            className="btn btn-sm btn-outline-secondary"
            title="Reset filters"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
