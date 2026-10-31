import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Pagination } from 'react-bootstrap';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/bookings', {
        params: { status: statusFilter, page, limit: 15 },
      });
      setBookings(res.data.bookings || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-ticket-perforated text-warning me-2"></i>
            System Bookings & Transactions ({total})
          </h3>
          <p className="text-secondary small mb-0">
            Monitor ticketing activity, cancellations, and customer transactions across cinemas.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'confirmed', 'cancelled', 'failed'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`btn btn-sm px-3 py-1 rounded-3 text-uppercase ${
              statusFilter === st
                ? 'btn-danger text-white fw-bold shadow'
                : 'btn-dark text-secondary border border-secondary border-opacity-25'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching global transactions..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBookings} />
      ) : (
        <div className="cinema-card-plain p-4 rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Movie & Hall</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th className="text-end">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-bold text-warning font-monospace">{b.bookingCode}</td>
                    <td>
                      <div className="fw-medium text-white">{b.user?.name || 'Guest'}</div>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                        {b.user?.email}
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                        {b.user?.phone || ''}
                      </div>
                    </td>
                    <td>
                      <div className="text-light fw-medium">{b.show?.movie?.title || 'Unknown'}</div>
                      <div className="text-secondary small">
                        {b.show?.theatre?.name} • {b.show?.theatre?.city}
                      </div>
                    </td>
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
                      {b.status === 'cancelled' && b.refundedAmount > 0 && (
                        <div className="text-info small" style={{ fontSize: '0.68rem' }}>
                          Refund: ₹{b.refundedAmount}
                        </div>
                      )}
                    </td>
                    <td className="small text-secondary">
                      {new Date(b.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/confirmation/${b._id}`}
                        className="btn btn-sm btn-outline-light py-0 px-2"
                        title="View Full Ticket Pass"
                      >
                        <i className="bi bi-qr-code"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination className="pagination-dark">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === page}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(page + 1)} />
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
