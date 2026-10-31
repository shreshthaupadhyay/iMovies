import React, { useState } from 'react';
import API from '../api/apiClient';
import { toast } from 'react-toastify';

const RazorpayPaymentButton = ({ totalAmount, onSuccess, isProcessing, showId, seatIds }) => {
  const [loading, setLoading] = useState(false);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const isLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create order from server
      const res = await API.post('/payments/razorpay/create-order', {
        amount: totalAmount,
        receipt: `rcpt_${Date.now()}`,
      });

      const { order } = res.data;
      const configRes = await API.get('/payments/config');
      const keyId = configRes.data.config.razorpayKeyId;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'IMovies Cinema',
        description: `Booking for ${seatIds.join(', ')}`,
        order_id: order.id,
        handler: function (response) {
          onSuccess({
            paymentMethod: 'card',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        theme: {
          color: '#E50914',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.message || 'Error opening Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRazorpay}
      disabled={isProcessing || loading}
      className="btn btn-outline-primary w-100 py-3 fw-bold fs-6 mt-3 d-flex align-items-center justify-content-center gap-2"
    >
      <i className="bi bi-wallet2"></i>
      {loading ? 'Initializing Razorpay...' : `Pay ₹${totalAmount} with Razorpay`}
    </button>
  );
};

export default RazorpayPaymentButton;
