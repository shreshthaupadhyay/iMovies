import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="display-1 fw-extrabold text-danger mb-2">404</div>
      <h3 className="fw-bold text-white mb-2">Scene Not Found</h3>
      <p className="text-secondary small mb-4" style={{ maxWidth: '440px' }}>
        The cinema reel you're looking for seems to have been cut or misplaced. Let's get you back to the main feature.
      </p>
      <Link to="/" className="btn btn-cinema px-4 py-2">
        <i className="bi bi-house-door-fill me-2"></i> Return to Box Office
      </Link>
    </div>
  );
};

export default NotFoundPage;
