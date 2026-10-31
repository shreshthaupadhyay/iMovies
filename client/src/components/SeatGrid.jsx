import React from 'react';
import { toast } from 'react-toastify';

const SeatGrid = ({ seats = [], selectedSeats = [], onToggleSeat, tierPrices = {} }) => {
  // Group seats by tier and row
  const premiumRows = ['A', 'B', 'C'];
  const regularRows = ['D', 'E', 'F', 'G', 'H'];
  const economyRows = ['I', 'J'];

  const getSeatStatus = (seat) => {
    const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    if (isSelected) return 'selected';
    if (seat.status === 'booked') return 'booked';
    if (seat.status === 'locked' && !seat.isMine) return 'locked';
    return 'available';
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') {
      toast.info('This seat is already booked.');
      return;
    }
    if (seat.status === 'locked' && !seat.isMine) {
      toast.warning('This seat is currently reserved by another guest.');
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    if (!isAlreadySelected && selectedSeats.length >= 10) {
      toast.error('You can select a maximum of 10 seats.');
      return;
    }

    onToggleSeat(seat);
  };

  const renderRow = (rowLetter) => {
    const rowSeats = seats
      .filter((s) => s.row === rowLetter)
      .sort((a, b) => a.number - b.number);

    return (
      <div key={rowLetter} className="d-flex align-items-center justify-content-center my-1">
        <span className="text-secondary fw-bold me-3 text-center" style={{ width: '20px', fontSize: '0.85rem' }}>
          {rowLetter}
        </span>

        <div className="d-flex align-items-center">
          {rowSeats.map((seat, idx) => {
            const status = getSeatStatus(seat);
            return (
              <React.Fragment key={seat.seatId}>
                {/* Aisle gap between seat 6 and 7 */}
                {idx === 6 && <div style={{ width: '24px' }}></div>}
                <div
                  className={`seat-cell seat-${status}`}
                  onClick={() => handleSeatClick(seat)}
                  title={`${seat.seatId} (${seat.tier}) - ₹${seat.price}`}
                >
                  {seat.number}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <span className="text-secondary fw-bold ms-3 text-center" style={{ width: '20px', fontSize: '0.85rem' }}>
          {rowLetter}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-4 cinema-card-plain text-center">
      {/* Curved Screen */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-curve"></div>
        <div className="text-muted fw-semibold tracking-wider text-uppercase mt-2" style={{ fontSize: '0.72rem', letterSpacing: '2px' }}>
          SCREEN THIS WAY
        </div>
      </div>

      {/* Seat Layout */}
      <div className="overflow-x-auto pb-3">
        {/* Premium Section */}
        <div className="mb-4">
          <div className="text-warning fw-bold small mb-2 d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-gem"></i>
            <span>PREMIUM - ₹{tierPrices.premium || 350}</span>
          </div>
          {premiumRows.map((r) => renderRow(r))}
        </div>

        {/* Regular Section */}
        <div className="mb-4">
          <div className="text-info fw-bold small mb-2 d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-star"></i>
            <span>EXECUTIVE - ₹{tierPrices.regular || 250}</span>
          </div>
          {regularRows.map((r) => renderRow(r))}
        </div>

        {/* Economy Section */}
        <div className="mb-3">
          <div className="text-secondary fw-bold small mb-2 d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-cash"></i>
            <span>ECONOMY - ₹{tierPrices.economy || 150}</span>
          </div>
          {economyRows.map((r) => renderRow(r))}
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex flex-wrap justify-content-center gap-4 mt-4 pt-3 border-top border-secondary border-opacity-25 small text-muted">
        <div className="d-flex align-items-center gap-2">
          <div className="seat-cell seat-available m-0" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}></div>
          <span>Available</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-cell seat-selected m-0" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}></div>
          <span>Selected</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-cell seat-locked m-0" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}></div>
          <span>Reserved (Held)</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-cell seat-booked m-0" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}></div>
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
