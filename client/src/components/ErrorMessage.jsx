import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 my-4 rounded-3 border-0 bg-danger bg-opacity-10 text-danger">
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill fs-5"></i>
        <span>{message || 'Something went wrong. Please try again.'}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-outline-danger">
          <i className="bi bi-arrow-clockwise me-1"></i> Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
