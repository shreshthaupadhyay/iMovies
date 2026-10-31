import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
  const calculateRemaining = () => {
    if (!expiryTimestamp) return 0;
    const difference = new Date(expiryTimestamp).getTime() - new Date().getTime();
    return Math.max(0, Math.floor(difference / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemaining());

  useEffect(() => {
    setSecondsLeft(calculateRemaining());
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  if (secondsLeft <= 0) {
    return (
      <span className="badge bg-danger p-2">
        <i className="bi bi-clock-fill me-1"></i> Lock Expired
      </span>
    );
  }

  return (
    <div
      className={`d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill ${
        isUrgent ? 'bg-danger text-white' : 'bg-warning text-dark'
      } fw-bold shadow-sm`}
    >
      <i className={`bi bi-stopwatch-fill ${isUrgent ? 'animate-pulse' : ''}`}></i>
      <span>
        Seats held for:{' '}
        <span className="font-monospace fs-6">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
};

export default CountdownTimer;
