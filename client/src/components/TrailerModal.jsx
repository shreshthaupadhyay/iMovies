import React from 'react';
import { Modal } from 'react-bootstrap';

const TrailerModal = ({ show, onHide, title, trailerUrl }) => {
  // Convert standard watch URL to embed URL
  let embedUrl = trailerUrl;
  if (trailerUrl && trailerUrl.includes('watch?v=')) {
    const videoId = trailerUrl.split('watch?v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (trailerUrl && trailerUrl.includes('youtu.be/')) {
    const videoId = trailerUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered contentClassName="bg-dark text-white border-secondary">
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title className="fs-5 fw-bold">
          <i className="bi bi-play-circle-fill text-danger me-2"></i>
          {title} - Official Trailer
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="ratio ratio-16x9">
          {show && (
            <iframe
              src={embedUrl}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TrailerModal;
