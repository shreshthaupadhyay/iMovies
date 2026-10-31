import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyBookings, cancelBookingThunk } from '../redux/slices/bookingSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const MyBookingsPage = () => {
  const dispatch = useDispatch();
  const { myBookings, isLoading, error } = useSelector((state) => state.booking);

  const [activeTab, setActiveTab] = useState('all');
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchMyBookings(activeTab));
  }, [dispatch, activeTab]);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setCancelling(true);
    try {
      await dispatch(
        cancelBookingThunk({
          bookingId: cancelModalBooking._id,
          reason: cancelReason,
        })
      ).unwrap();
      toast.success('Booking cancelled successfully. Full refund initiated!');
      setCancelModalBooking(null);
      dispatch(fetchMyBookings(activeTab));
    } catch (err) {
      toast.error(err || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const isCancellable = (booking) => {
    if (booking.status !== 'confirmed') return false;
    if (!booking.show?.startTime) return false;
    const showTime = new Date(booking.show.startTime).getTime();
    const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
    return showTime > twoHoursFromNow;
  };

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-white mb-1">
            <i className="bi bi-ticket-perforated-fill text-danger me-2"></i>
            My Bookings
          </h3>
          <p className="text-secondary small mb-0">
            View upcoming tickets, access digital QR passes, or track refunds.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Bookings' },
          { key: 'upcoming', label: 'Upcoming Shows' },
          { key: 'past', label: 'Past Shows' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm px-3 py-2 rounded-3 text-nowrap ${
              activeTab === tab.key
                ? 'btn-danger text-white fw-bold shadow'
                : 'btn-dark text-secondary border border-secondary border-opacity-25'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Fetching your tickets history..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => dispatch(fetchMyBookings(activeTab))} />
      ) : myBookings.length === 0 ? (
        <div className="text-center py-5 cinema-card-plain p-4 rounded-4 my-3">
          <i className="bi bi-ticket text-secondary display-4 mb-3 d-block"></i>
          <h5 className="text-white fw-bold">No bookings found</h5>
          <p className="text-muted small">
            You don't have any {activeTab !== 'all' ? activeTab : ''} bookings recorded.
          </p>
          <Link to="/" className="btn btn-cinema btn-sm mt-2">
            Explore Now Showing Movies
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {myBookings.map((b) => {
            const movie = b.show?.movie;
            const theatre = b.show?.theatre;
            const cancellable = isCancellable(b);

            const showDate = b.show?.startTime
              ? new Date(b.show.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A';

            const showTime = b.show?.startTime
              ? new Date(b.show.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A';

            return (
              <div key={b._id} className="cinema-card-plain p-3 p-md-4 rounded-4 text-white">
                <div className="row g-3 align-items-center">
                  {/* Poster Thumbnail */}
                  <div className="col-3 col-sm-2 col-md-1 text-center">
                    <img
                      src={movie?.poster || 'https://placehold.co/100x150/1e293b/f8fafc?text=Movie'}
                      alt={movie?.title}
                      className="img-fluid rounded"
                      style={{ maxHeight: '100px', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div className="col-9 col-sm-6 col-md-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold fs-5 text-white">{movie?.title}</span>
                      <span
                        className={`badge ${
                          b.status === 'confirmed'
                            ? 'bg-success'
                            : b.status === 'cancelled'
                            ? 'bg-danger'
                            : 'bg-secondary'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-secondary small">{theatre?.name}</div>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      {b.show?.screen} • {theatre?.city}
                    </div>

                    <div className="mt-2 text-warning small fw-semibold">
                      <i className="bi bi-calendar-event me-1"></i>
                      {showDate} at {showTime}
                    </div>
                  </div>

                  {/* Seats & Amount */}
                  <div className="col-6 col-sm-4 col-md-3">
                    <div className="text-secondary small">SEATS ({b.seats?.length}):</div>
                    <div className="fw-bold text-success fs-6">
                      {b.seats?.map((s) => s.seatId).join(', ')}
                    </div>

                    <div className="text-secondary small mt-1">TOTAL AMOUNT:</div>
                    <div className="fw-bold text-light fs-6">₹{b.totalAmount}</div>

                    {b.status === 'cancelled' && b.refundedAmount > 0 && (
                      <div className="text-info small mt-1" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-arrow-return-left me-1"></i>
                        Refunded: ₹{b.refundedAmount}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-6 col-sm-12 col-md-3 text-end d-flex flex-column gap-2 justify-content-center">
                    <Link
                      to={`/confirmation/${b._id}`}
                      className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center gap-1"
                    >
                      <i className="bi bi-qr-code"></i>
                      <span>View Ticket</span>
                    </Link>

                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        disabled={!cancellable}
                        className={`btn btn-sm ${
                          cancellable ? 'btn-outline-danger' : 'btn-dark text-muted border-0'
                        }`}
                        title={
                          cancellable
                            ? 'Cancel booking and get refund'
                            : 'Cancellation closed (must be at least 2 hours before show)'
                        }
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        {cancellable ? 'Cancel Ticket' : 'Non-Cancellable (<2h)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        show={Boolean(cancelModalBooking)}
        onHide={() => setCancelModalBooking(null)}
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5 fw-bold text-danger">
            <i className="bi bi-exclamation-octagon-fill me-2"></i>
            Cancel Booking & Request Refund
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCancelSubmit}>
          <Modal.Body>
            <p className="small text-light">
              Are you sure you want to cancel your tickets for{' '}
              <strong className="text-white">{cancelModalBooking?.show?.movie?.title}</strong>?
            </p>

            <div className="p-3 bg-secondary bg-opacity-10 rounded mb-3 small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Seats:</span>
                <span className="text-light">{cancelModalBooking?.seats?.map((s) => s.seatId).join(', ')}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Showtime:</span>
                <span className="text-warning">
                  {new Date(cancelModalBooking?.show?.startTime || '').toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between fw-bold pt-2 border-top border-secondary">
                <span className="text-white">Refund Amount:</span>
                <span className="text-success fs-6">₹{cancelModalBooking?.totalAmount}</span>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Reason for Cancellation</Form.Label>
              <Form.Select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-dark text-light border-secondary"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked wrong showtime or date">Booked wrong showtime or date</option>
                <option value="Emergency or unexpected conflict">Emergency or unexpected conflict</option>
                <option value="Selected incorrect seats">Selected incorrect seats</option>
              </Form.Select>
            </Form.Group>

            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
              Refund will be processed back to your original payment method immediately.
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setCancelModalBooking(null)}
            >
              Keep Tickets
            </button>
            <button type="submit" disabled={cancelling} className="btn btn-danger btn-sm">
              {cancelling ? 'Processing Cancellation...' : 'Confirm Cancellation'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MyBookingsPage;
