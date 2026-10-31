import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearAuthError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await dispatch(register({ name, email, password, phone })).unwrap();
      toast.success(`Account created! Welcome to IMovies, ${res.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err || 'Registration failed');
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="cinema-card-plain p-4 p-md-5 rounded-4 text-white w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <span className="fs-1 d-block mb-1">🎬</span>
          <h3 className="fw-bold text-white mb-1">
            Create an <span className="text-danger">I</span>Movies Account
          </h3>
          <p className="text-secondary small">Join thousands of cinema lovers today.</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small text-secondary">Full Name</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aman Sharma"
                required
                className="form-control bg-dark text-light border-secondary"
              />
            </div>
          </div>

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

          <div className="mb-3">
            <label className="form-label small text-secondary">Phone Number</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light">
                <i className="bi bi-telephone"></i>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
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
                placeholder="Minimum 6 characters"
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
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25 small text-muted">
          Already registered?{' '}
          <Link to="/login" className="text-danger fw-semibold text-decoration-none">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
