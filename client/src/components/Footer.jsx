import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto py-5" style={{ backgroundColor: '#090d17', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-3">🎬</span>
              <span className="fw-bold fs-4 text-white">
                <span className="text-danger">I</span>MOVIES
              </span>
            </div>
            <p className="text-muted small pe-md-4">
              Your ultimate online cinema companion. Discover the latest releases, browse showtimes across top theatres, select seats in real-time, and book seamlessly with zero hassle.
            </p>
            <div className="d-flex gap-3 text-muted fs-5">
              <i className="bi bi-facebook cursor-pointer"></i>
              <i className="bi bi-twitter-x cursor-pointer"></i>
              <i className="bi bi-instagram cursor-pointer"></i>
              <i className="bi bi-youtube cursor-pointer"></i>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="text-white fw-bold mb-3">Explore</h6>
            <ul className="list-unstyled text-muted small d-flex flex-column gap-2">
              <li><Link to="/" className="text-muted text-decoration-none">Now Showing</Link></li>
              <li><Link to="/" className="text-muted text-decoration-none">Upcoming Movies</Link></li>
              <li><Link to="/" className="text-muted text-decoration-none">Cinemas & Theatres</Link></li>
              <li><Link to="/" className="text-muted text-decoration-none">IMAX & 4DX Shows</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-3">
            <h6 className="text-white fw-bold mb-3">Popular Cities</h6>
            <ul className="list-unstyled text-muted small d-flex flex-column gap-2">
              <li>Bhopal (DB City Mall, Aashima Mall)</li>
              <li>Indore (Treasure Island Mall)</li>
              <li>Mumbai (Phoenix Palladium, Viviana)</li>
              <li>Delhi NCR (Coming Soon)</li>
            </ul>
          </div>

          <div className="col-12 col-md-3">
            <h6 className="text-white fw-bold mb-3">Zero-Setup App</h6>
            <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-success">Embedded DB Ready</span>
                <span className="badge bg-primary">Mock Gateway</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
                Powered by MERN Stack, Socket.io real-time seat synchronization, and automatic fallback in-memory MongoDB.
              </p>
            </div>
          </div>
        </div>

        <div className="border-top border-secondary border-opacity-25 mt-4 pt-4 text-center text-muted small">
          © {new Date().getFullYear()} IMovies Cinema Booking. All rights reserved. Built with precision and care.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
