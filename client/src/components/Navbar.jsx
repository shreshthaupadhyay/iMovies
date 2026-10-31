import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, Badge, Form, InputGroup } from 'react-bootstrap';
import { logout } from '../redux/slices/authSlice';
import { setCity, setFilter } from '../redux/slices/movieSlice';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../redux/slices/notificationSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { filters, filterOptions } = useSelector((state) => state.movies);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
      const interval = setInterval(() => {
        dispatch(fetchNotifications());
      }, 30000); // Polling notifications every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dispatch]);

  const handleCityChange = (cityName) => {
    dispatch(setCity(cityName));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilter({ search: searchTerm }));
    navigate('/');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: '#0e1424', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container-fluid px-lg-4">
        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white fs-4" to="/">
          <span style={{ fontSize: '1.7rem' }}>🎬</span>
          <span className="text-danger fw-extrabold tracking-wide">I</span>MOVIES
        </Link>

        {/* City Selector */}
        <div className="ms-3 me-auto d-none d-md-block">
          <Dropdown>
            <Dropdown.Toggle
              variant="dark"
              id="city-dropdown"
              className="d-flex align-items-center gap-1 border-0 text-light fw-medium px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <i className="bi bi-geo-alt-fill text-danger"></i>
              <span>{filters.city || 'Bhopal'}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-dark">
              {(filterOptions.cities || ['Bhopal', 'Indore', 'Mumbai']).map((c) => (
                <Dropdown.Item
                  key={c}
                  active={filters.city === c}
                  onClick={() => handleCityChange(c)}
                >
                  {c}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="d-none d-lg-block mx-4" style={{ width: '320px' }}>
          <InputGroup size="sm">
            <Form.Control
              type="text"
              placeholder="Search movies, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-dark text-light border-secondary"
            />
            <button className="btn btn-outline-secondary" type="submit">
              <i className="bi bi-search"></i>
            </button>
          </InputGroup>
        </form>

        {/* Right Nav Options */}
        <div className="d-flex align-items-center gap-3">
          {/* Notification Bell */}
          {isAuthenticated && (
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="text-light position-relative p-1 text-decoration-none border-0"
                id="notifications-dropdown"
              >
                <i className="bi bi-bell-fill fs-5"></i>
                {unreadCount > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="dropdown-menu-dark p-2"
                style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}
              >
                <div className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom border-secondary mb-2">
                  <span className="fw-semibold text-white small">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      className="btn btn-link btn-sm text-info p-0 text-decoration-none"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => dispatch(markAllNotificationsRead())}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center text-muted py-3 small">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => dispatch(markNotificationRead(n._id))}
                      className={`p-2 mb-1 rounded small cursor-pointer ${
                        n.read ? 'text-muted' : 'text-light bg-secondary bg-opacity-25'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <i
                          className={`bi ${
                            n.type === 'booking'
                              ? 'bi-ticket-perforated-fill text-success'
                              : n.type === 'cancellation'
                              ? 'bi-x-circle-fill text-danger'
                              : 'bi-info-circle-fill text-info'
                          } mt-1`}
                        ></i>
                        <div className="flex-grow-1">
                          <div>{n.message}</div>
                          <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="dark"
                id="user-menu"
                className="d-flex align-items-center gap-2 border-0 bg-transparent text-light"
              >
                <div
                  className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="d-none d-sm-inline fw-medium">{user?.name}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-menu-dark">
                <div className="px-3 py-2 border-bottom border-secondary">
                  <div className="fw-semibold text-white">{user?.name}</div>
                  <div className="text-muted small">{user?.email}</div>
                  {user?.role === 'admin' && (
                    <span className="badge bg-warning text-dark mt-1">Admin</span>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <Dropdown.Item as={Link} to="/admin">
                    <i className="bi bi-speedometer2 me-2 text-warning"></i>
                    Admin Dashboard
                  </Dropdown.Item>
                )}

                <Dropdown.Item as={Link} to="/my-bookings">
                  <i className="bi bi-ticket-perforated me-2 text-danger"></i>
                  My Bookings
                </Dropdown.Item>

                <Dropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2 text-info"></i>
                  Profile Settings
                </Dropdown.Item>

                <Dropdown.Divider className="border-secondary" />

                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-cinema btn-sm">
                <i className="bi bi-person-fill me-1"></i> Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
