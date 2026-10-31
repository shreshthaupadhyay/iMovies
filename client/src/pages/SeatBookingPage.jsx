import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchShowSeats,
  toggleSeatSelection,
  clearSelectedSeats,
  lockSeatsThunk,
  updateSeatStatusFromSocket,
} from '../redux/slices/bookingSlice';
import useSocket from '../hooks/useSocket';
import SeatGrid from '../components/SeatGrid';
import CountdownTimer from '../components/CountdownTimer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { toast } from 'react-toastify';

const SeatBookingPage = () => {
  const { showId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { show, seats, selectedSeats, lockExpiresAt, isLoading, error } = useSelector(
    (state) => state.booking
  );

  const [isLocking, setIsLocking] = useState(false);

  // Setup real-time socket events for live seat synchronization
  const onSeatLock = useCallback(
    (data) => {
      dispatch(
        updateSeatStatusFromSocket({
          seatIds: data.seatIds,
          status: 'locked',
          lockedBy: data.lockedBy,
        })
      );
    },
    [dispatch]
  );

  const onSeatUnlock = useCallback(
    (data) => {
      dispatch(
        updateSeatStatusFromSocket({
          seatIds: data.seatIds,
          status: 'available',
        })
      );
    },
    [dispatch]
  );

  const onSeatBooked = useCallback(
    (data) => {
      dispatch(
        updateSeatStatusFromSocket({
          seatIds: data.seatIds,
          status: 'booked',
        })
      );
    },
    [dispatch]
  );

  const onSeatReleased = useCallback(
    (data) => {
      dispatch(
        updateSeatStatusFromSocket({
          seatIds: data.seatIds,
          status: 'available',
        })
      );
    },
    [dispatch]
  );

  useSocket(showId, {
    onSeatLock,
    onSeatUnlock,
    onSeatBooked,
    onSeatReleased,
  });

  useEffect(() => {
    dispatch(clearSelectedSeats());
    dispatch(fetchShowSeats(showId));
  }, [dispatch, showId]);

  const handleToggleSeat = (seat) => {
    dispatch(toggleSeatSelection(seat));
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to proceed with ticket booking');
      navigate('/login', { state: { from: `/booking/${showId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed');
      return;
    }

    setIsLocking(true);
    try {
      const seatIds = selectedSeats.map((s) => s.seatId);
      await dispatch(lockSeatsThunk({ showId, seatIds })).unwrap();
      toast.success('Seats reserved for 5 minutes! Proceeding to payment...');
      navigate(`/payment/${showId}`);
    } catch (err) {
      toast.error(err || 'Failed to lock selected seats. Please choose other seats.');
      dispatch(fetchShowSeats(showId));
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading interactive seat map..." />;
  if (error || !show) return <ErrorMessage message={error || 'Show details could not be loaded'} />;

  // Financial calculations
  const baseTicketAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFeePerTicket = 25;
  const totalConvenienceFee = selectedSeats.length * convenienceFeePerTicket;
  const gstAmount = Math.round(totalConvenienceFee * 0.18);
  const grandTotal = baseTicketAmount + totalConvenienceFee + gstAmount;

  const showDateFormatted = new Date(show.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const showTimeFormatted = new Date(show.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container py-4">
      {/* Top Header / Breadcrumbs */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item">
                <Link to="/" className="text-muted text-decoration-none">
                  Movies
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/movie/${show.movie?._id}`} className="text-muted text-decoration-none">
                  {show.movie?.title}
                </Link>
              </li>
              <li className="breadcrumb-item active text-danger" aria-current="page">
                Seat Selection
              </li>
            </ol>
          </nav>

          <h3 className="fw-bold text-white mb-0">{show.movie?.title}</h3>
          <div className="text-secondary small mt-1">
            <span className="text-light fw-medium">{show.theatre?.name}</span> ({show.theatre?.city}) •{' '}
            <span className="text-info">{show.screen}</span> •{' '}
            <span className="text-warning">
              {showDateFormatted}, {showTimeFormatted}
            </span>
          </div>
        </div>

        {lockExpiresAt && (
          <div className="mt-3 mt-md-0">
            <CountdownTimer
              expiryTimestamp={lockExpiresAt}
              onExpire={() => {
                toast.error('Seat reservation expired. Please reselect your seats.');
                dispatch(clearSelectedSeats());
                dispatch(fetchShowSeats(showId));
              }}
            />
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Left Side: Seat Layout Grid */}
        <div className="col-12 col-lg-8">
          <SeatGrid
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            tierPrices={show.prices || {}}
          />
        </div>

        {/* Right Side: Booking Summary Card */}
        <div className="col-12 col-lg-4">
          <div className="cinema-card-plain p-4 rounded-4 sticky-top" style={{ top: '85px' }}>
            <h5 className="fw-bold text-white mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              Booking Summary
            </h5>

            {/* Selected Seats Badges */}
            <div className="mb-3">
              <div className="text-secondary small text-uppercase mb-2">
                Selected Seats ({selectedSeats.length}/10):
              </div>
              {selectedSeats.length === 0 ? (
                <div className="text-muted small fst-italic">No seats selected yet. Click on available seats in the map.</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <span key={s.seatId} className="badge bg-success p-2 fs-6">
                      {s.seatId} <span className="small opacity-75">(₹{s.price})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            {selectedSeats.length > 0 && (
              <div className="my-3 pt-3 border-top border-secondary border-opacity-25 small">
                <div className="d-flex justify-content-between text-secondary mb-2">
                  <span>Tickets Base Price:</span>
                  <span className="text-light fw-medium">₹{baseTicketAmount}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary mb-2">
                  <span>Convenience Fee ({selectedSeats.length} × ₹{convenienceFeePerTicket}):</span>
                  <span className="text-light fw-medium">₹{totalConvenienceFee}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary mb-3">
                  <span>Integrated GST (18%):</span>
                  <span className="text-light fw-medium">₹{gstAmount}</span>
                </div>

                <div className="d-flex justify-content-between text-white fw-bold fs-5 pt-2 border-top border-secondary border-opacity-50">
                  <span>Grand Total:</span>
                  <span className="text-warning">₹{grandTotal}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4">
              <button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || isLocking}
                className="btn btn-cinema w-100 py-3 fw-bold fs-6 shadow d-flex align-items-center justify-content-center gap-2"
              >
                {isLocking ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Holding Seats...
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay</span>
                    {selectedSeats.length > 0 && <span>• ₹{grandTotal}</span>}
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>

              {selectedSeats.length > 0 && (
                <button
                  onClick={() => dispatch(clearSelectedSeats())}
                  className="btn btn-link btn-sm text-secondary w-100 mt-2 text-decoration-none"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatBookingPage;
