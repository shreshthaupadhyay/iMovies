import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/apiClient';
import TicketView from '../components/TicketView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ConfirmationPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await API.get(`/bookings/${id}`);
        setBooking(res.data.booking);
        setPayment(res.data.payment);
      } catch (err) {
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBooking();
    }
  }, [id]);

  if (loading) return <LoadingSpinner message="Generating your verified cinema ticket..." />;
  if (error || !booking) return <ErrorMessage message={error || 'Ticket could not be retrieved.'} />;

  return (
    <div className="container py-5">
      {/* Success Notification Bar */}
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3 shadow"
          style={{ width: '64px', height: '64px', fontSize: '2rem' }}
        >
          <i className="bi bi-check-lg"></i>
        </div>
        <h2 className="fw-extrabold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-secondary small">
          We have sent your confirmation details to{' '}
          <span className="text-light fw-medium">{booking.user?.email}</span>.
        </p>
      </div>

      {/* Ticket View */}
      <TicketView booking={booking} />

      {/* Bottom Nav Links */}
      <div className="d-flex justify-content-center gap-3 mt-4 d-print-none">
        <Link to="/" className="btn btn-dark border-secondary px-4 py-2">
          <i className="bi bi-house me-2"></i> Back to Movies
        </Link>
        <Link to="/my-bookings" className="btn btn-cinema px-4 py-2">
          <i className="bi bi-ticket-perforated me-2"></i> View All Bookings
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
