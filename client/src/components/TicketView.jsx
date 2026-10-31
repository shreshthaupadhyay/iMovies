import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TicketView = ({ booking, onPrint }) => {
  if (!booking) return null;

  const { show, user, seats = [], totalAmount, bookingCode, createdAt } = booking;
  const movie = show?.movie;
  const theatre = show?.theatre;

  const showDateFormatted = show?.startTime
    ? new Date(show.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const showTimeFormatted = show?.startTime
    ? new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const qrData = JSON.stringify({
    code: bookingCode,
    movie: movie?.title,
    seats: seats.map((s) => s.seatId),
    showTime: show?.startTime,
  });

  return (
    <div className="ticket-container p-4 p-md-5 my-4 mx-auto text-white" style={{ maxWidth: '680px' }}>
      <div className="ticket-notch-left"></div>
      <div className="ticket-notch-right"></div>

      {/* Ticket Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-50">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-3">🎬</span>
          <span className="fw-bold fs-4">
            <span className="text-danger">I</span>MOVIES TICKET
          </span>
        </div>
        <div className="text-end">
          <span className="badge bg-success px-3 py-2 fs-6">CONFIRMED</span>
        </div>
      </div>

      {/* Movie & Show Info */}
      <div className="row g-4 align-items-center mb-4">
        <div className="col-4 col-sm-3 text-center">
          <img
            src={movie?.poster || 'https://placehold.co/150x220/1e293b/f8fafc?text=Poster'}
            alt={movie?.title}
            className="img-fluid rounded shadow"
            style={{ maxHeight: '160px', objectFit: 'cover' }}
          />
        </div>

        <div className="col-8 col-sm-9">
          <h4 className="fw-bold text-white mb-1">{movie?.title}</h4>
          <div className="text-muted small mb-3">
            <span className="badge bg-danger text-uppercase me-2">{show?.language || movie?.language}</span>
            <span className="badge bg-secondary me-2">{show?.format || '2D'}</span>
            <span>{movie?.duration} min</span>
          </div>

          <div className="fw-semibold text-light">{theatre?.name}</div>
          <div className="text-secondary small">{theatre?.address}</div>
          <div className="text-info small mt-1">{show?.screen}</div>
        </div>
      </div>

      <div className="ticket-divider"></div>

      {/* Showtime, Seats, and QR */}
      <div className="row g-3 align-items-center justify-content-between">
        <div className="col-12 col-sm-7">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                SHOW DATE
              </div>
              <div className="fw-bold text-light">{showDateFormatted}</div>
            </div>

            <div className="col-6">
              <div className="text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                SHOWTIME
              </div>
              <div className="fw-bold text-warning">{showTimeFormatted}</div>
            </div>

            <div className="col-6">
              <div className="text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                SEATS ({seats.length})
              </div>
              <div className="fw-bold text-success fs-5">
                {seats.map((s) => s.seatId).join(', ')}
              </div>
            </div>

            <div className="col-6">
              <div className="text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                TOTAL PAID
              </div>
              <div className="fw-bold text-light fs-5">₹{totalAmount}</div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-muted small">
            Booked by: <span className="text-light">{user?.name}</span> ({user?.email})
          </div>
        </div>

        {/* QR Code and Booking Code */}
        <div className="col-12 col-sm-5 text-center text-sm-end">
          <div className="d-inline-block p-2 bg-white rounded shadow">
            <QRCodeSVG value={qrData} size={110} level="M" />
          </div>
          <div className="mt-2 text-center text-sm-end">
            <div className="text-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
              BOOKING CODE
            </div>
            <div className="fw-extrabold text-warning font-monospace fs-5 tracking-wider">
              {bookingCode}
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center d-print-none">
        <span className="text-muted small">
          Please show this QR code at cinema ticket counter.
        </span>
        <button
          onClick={onPrint || (() => window.print())}
          className="btn btn-sm btn-outline-light d-flex align-items-center gap-2"
        >
          <i className="bi bi-printer-fill"></i>
          <span>Print / Save Ticket</span>
        </button>
      </div>
    </div>
  );
};

export default TicketView;
