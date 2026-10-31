import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());

    try {
      const res = await dispatch(login({ email, password })).unwrap();
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'admin' && from === '/') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err || 'Login failed. Please check credentials.');
    }
  };

  const fillAdmin = () => {
    setEmail('admin@imovies.com');
    setPassword('Admin@123');
  };

  const fillUser = () => {
    setEmail('user@imovies.com');
    setPassword('User@123');
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="cinema-card-plain p-4 p-md-5 rounded-4 text-white w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <span className="fs-1 d-block mb-1">🎬</span>
          <h3 className="fw-bold text-white mb-1">
            Sign In to <span className="text-danger">I</span>Movies
          </h3>
          <p className="text-secondary small">Access tickets, exclusive offers, and reservations.</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* 1-Click Demo Buttons */}
        <div className="p-3 mb-4 rounded-3 bg-dark border border-secondary border-opacity-50">
          <div className="text-muted small fw-semibold text-uppercase mb-2 text-center" style={{ fontSize: '0.72rem' }}>
            ⚡ Instant One-Click Demo Credentials
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={fillUser}
              className="btn btn-sm btn-outline-info flex-grow-1 py-1"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-person me-1"></i> Demo User
            </button>
            <button
              type="button"
              onClick={fillAdmin}
              className="btn btn-sm btn-outline-warning flex-grow-1 py-1"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-shield-lock me-1"></i> Admin Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small text-secondary">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="form-control bg-dark text-light border-secondary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light">
                <i className="bi bi-key"></i>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-control bg-dark text-light border-secondary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-cinema w-100 py-2 fw-semibold fs-6 shadow"
          >
            {isLoading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25 small text-muted">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-danger fw-semibold text-decoration-none">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
