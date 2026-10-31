import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  payAndConfirmBooking,
  fetchPaymentConfig,
  clearSelectedSeats,
} from '../redux/slices/bookingSlice';
import MockPaymentGateway from '../components/MockPaymentGateway';
import RazorpayPaymentButton from '../components/RazorpayPaymentButton';
import CountdownTimer from '../components/CountdownTimer';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { showId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { show, selectedSeats, lockExpiresAt, isProcessingPayment, paymentConfig } = useSelector(
    (state) => state.booking
  );

  useEffect(() => {
    dispatch(fetchPaymentConfig());
  }, [dispatch]);

  // If user arrives here without locked seats, return to seat booking
  useEffect(() => {
    if (!selectedSeats || selectedSeats.length === 0) {
      toast.warning('No seats selected or session expired. Please reselect seats.');
      navigate(`/booking/${showId}`);
    }
  }, [selectedSeats, showId, navigate]);

  const handlePaymentSubmit = async (paymentPayload) => {
    try {
      const seatIds = selectedSeats.map((s) => s.seatId);
      const res = await dispatch(
        payAndConfirmBooking({
          showId,
          seatIds,
          ...paymentPayload,
        })
      ).unwrap();

      toast.success('Payment successful! Booking confirmed.');
      navigate(`/confirmation/${res.booking._id}`);
    } catch (err) {
      toast.error(err || 'Payment failed or declined. Reserved seats released.');
      navigate(`/booking/${showId}`);
    }
  };

  const handleTimerExpire = () => {
    toast.error('Reservation timeout! Your seats have been released.');
    dispatch(clearSelectedSeats());
    navigate(`/booking/${showId}`);
  };

  const baseTicketAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 25;
  const gst = Math.round(convenienceFee * 0.18);
  const grandTotal = baseTicketAmount + convenienceFee + gst;

  if (!show || selectedSeats.length === 0) return null;

  return (
    <div className="container py-5">
      {/* Top Banner with Countdown */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">Secure Checkout</h3>
          <div className="text-secondary small">
            {show.movie?.title} • {show.theatre?.name} • Seats: {selectedSeats.map((s) => s.seatId).join(', ')}
          </div>
        </div>

        {lockExpiresAt && (
          <div className="mt-3 mt-md-0">
            <CountdownTimer expiryTimestamp={lockExpiresAt} onExpire={handleTimerExpire} />
          </div>
        )}
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-12 col-lg-8">
          {/* Mock Payment Gateway Form */}
          <MockPaymentGateway
            totalAmount={grandTotal}
            onSubmit={handlePaymentSubmit}
            isProcessing={isProcessingPayment}
          />

          {/* Razorpay Option if Configured */}
          {paymentConfig.razorpayAvailable && (
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center">
              <span className="text-muted small d-block mb-2">Or pay using Razorpay payment gateway:</span>
              <RazorpayPaymentButton
                totalAmount={grandTotal}
                showId={showId}
                seatIds={selectedSeats.map((s) => s.seatId)}
                onSuccess={handlePaymentSubmit}
                isProcessing={isProcessingPayment}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
