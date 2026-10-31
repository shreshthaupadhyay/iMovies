import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'react-toastify';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importingTmdb, setImportingTmdb] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/stats');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTmdbImport = async () => {
    setImportingTmdb(true);
    try {
      const res = await API.post('/admin/tmdb/import', { page: 1 });
      toast.success(res.data.message || 'Movies imported from TMDB!');
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'TMDB Import failed');
    } finally {
      setImportingTmdb(false);
    }
  };

  if (loading) return <LoadingSpinner message="Aggregating platform metrics..." />;
  if (error || !data) return <ErrorMessage message={error || 'Failed to load dashboard'} onRetry={fetchStats} />;

  const { stats, chartData, recentBookings, tmdbAvailable } = data;

  return (
    <div className="container py-4">
      {/* Admin Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h2 className="fw-extrabold text-white mb-1">
            <i className="bi bi-speedometer2 text-warning me-2"></i>
            Admin Management Portal
          </h2>
          <p className="text-secondary small mb-0">
            Real-time box office analytics, catalogue controls, and system operations.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          {tmdbAvailable && (
            <button
              onClick={handleTmdbImport}
              disabled={importingTmdb}
              className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
            >
              <i className="bi bi-cloud-arrow-down-fill"></i>
              {importingTmdb ? 'Importing TMDB...' : 'Import from TMDB'}
            </button>
          )}

          <Link to="/" className="btn btn-sm btn-outline-light">
            <i className="bi bi-box-arrow-up-right me-1"></i> Live Site
          </Link>
        </div>
      </div>

      {/* Admin Nav Shortcuts */}
      <div className="d-flex flex-wrap gap-2 mb-4 pb-1">
        <Link to="/admin" className="btn btn-sm btn-danger active px-3">
          <i className="bi bi-graph-up me-1"></i> Overview
        </Link>
        <Link to="/admin/movies" className="btn btn-sm btn-dark text-light border-secondary px-3">
          <i className="bi bi-film me-1"></i> Movies ({stats.totalMovies})
        </Link>
        <Link to="/admin/theatres" className="btn btn-sm btn-dark text-light border-secondary px-3">
          <i className="bi bi-building me-1"></i> Theatres ({stats.totalTheatres})
        </Link>
        <Link to="/admin/shows" className="btn btn-sm btn-dark text-light border-secondary px-3">
          <i className="bi bi-calendar3 me-1"></i> Shows ({stats.totalShows})
        </Link>
        <Link to="/admin/bookings" className="btn btn-sm btn-dark text-light border-secondary px-3">
          <i className="bi bi-ticket-perforated me-1"></i> Bookings ({stats.totalBookings})
        </Link>
        <Link to="/admin/users" className="btn btn-sm btn-dark text-light border-secondary px-3">
          <i className="bi bi-people me-1"></i> Users ({stats.totalUsers})
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">
        {/* Total Revenue */}
        <div className="col">
          <div className="cinema-card-plain p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-secondary small fw-semibold text-uppercase">Total Box Office</div>
                <h3 className="fw-bold text-success mt-1 mb-0">₹{stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success fs-4">
                <i className="bi bi-currency-rupee"></i>
              </div>
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
              <i className="bi bi-check-circle-fill text-success me-1"></i> Confirmed bookings
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col">
          <div className="cinema-card-plain p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-secondary small fw-semibold text-uppercase">Total Bookings</div>
                <h3 className="fw-bold text-warning mt-1 mb-0">{stats.totalBookings}</h3>
              </div>
              <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning fs-4">
                <i className="bi bi-ticket-perforated"></i>
              </div>
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
              Confirmed & reservations
            </div>
          </div>
        </div>

        {/* Active Movies */}
        <div className="col">
          <div className="cinema-card-plain p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-secondary small fw-semibold text-uppercase">Catalogue Titles</div>
                <h3 className="fw-bold text-info mt-1 mb-0">{stats.totalMovies}</h3>
              </div>
              <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info fs-4">
                <i className="bi bi-film"></i>
              </div>
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
              Now showing & upcoming
            </div>
          </div>
        </div>

        {/* Registered Users */}
        <div className="col">
          <div className="cinema-card-plain p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-secondary small fw-semibold text-uppercase">Registered Users</div>
                <h3 className="fw-bold text-danger mt-1 mb-0">{stats.totalUsers}</h3>
              </div>
              <div className="p-2 rounded-3 bg-danger bg-opacity-10 text-danger fs-4">
                <i className="bi bi-people"></i>
              </div>
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
              Customers & staff
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="cinema-card-plain p-4 rounded-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-white mb-0">7-Day Revenue & Booking Velocity</h5>
            <span className="text-secondary small">Daily ticketing trends and revenue trends</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e50914" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#e50914" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Tickets"
                stroke="#e50914"
                fillOpacity={1}
                fill="url(#colorBookings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="cinema-card-plain p-4 rounded-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-white mb-0">Recent Bookings</h5>
          <Link to="/admin/bookings" className="btn btn-sm btn-outline-secondary">
            View All Bookings <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr className="text-secondary small text-uppercase">
                <th>Code</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Seats</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b._id}>
                  <td className="fw-bold text-warning font-monospace">{b.bookingCode}</td>
                  <td>
                    <div className="text-light">{b.user?.name || 'Guest'}</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      {b.user?.email}
                    </div>
                  </td>
                  <td>{b.show?.movie?.title || 'Unknown Movie'}</td>
                  <td>
                    <span className="badge bg-secondary">
                      {b.seats?.map((s) => s.seatId).join(', ')}
                    </span>
                  </td>
                  <td className="fw-bold text-light">₹{b.totalAmount}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === 'confirmed'
                          ? 'bg-success'
                          : b.status === 'cancelled'
                          ? 'bg-danger'
                          : 'bg-secondary'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
