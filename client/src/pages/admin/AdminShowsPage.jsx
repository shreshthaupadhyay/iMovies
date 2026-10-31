import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AdminShowsPage = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [format, setFormat] = useState('2D');
  const [pricePremium, setPricePremium] = useState(350);
  const [priceRegular, setPriceRegular] = useState(250);
  const [priceEconomy, setPriceEconomy] = useState(150);

  const fetchShowsData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        API.get('/shows'),
        API.get('/movies?status=nowShowing&limit=50'),
        API.get('/theatres'),
      ]);

      setShows(showsRes.data.shows || []);
      setMovies(moviesRes.data.movies || []);
      setTheatres(theatresRes.data.theatres || []);
    } catch (err) {
      setError(err.message || 'Failed to load shows data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowsData();
  }, []);

  const openAddModal = () => {
    if (movies.length > 0) setSelectedMovieId(movies[0]._id);
    if (theatres.length > 0) {
      setSelectedTheatreId(theatres[0]._id);
      setSelectedScreen(theatres[0].screens?.[0]?.name || 'Screen 1');
    }

    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 2, 0, 0, 0);
    const defaultEnd = new Date(defaultStart.getTime() + 150 * 60 * 1000);

    setStartTime(defaultStart.toISOString().slice(0, 16));
    setEndTime(defaultEnd.toISOString().slice(0, 16));
    setFormat('2D');
    setPricePremium(350);
    setPriceRegular(250);
    setPriceEconomy(150);

    setShowModal(true);
  };

  const handleTheatreChange = (tId) => {
    setSelectedTheatreId(tId);
    const chosen = theatres.find((t) => t._id === tId);
    if (chosen && chosen.screens && chosen.screens.length > 0) {
      setSelectedScreen(chosen.screens[0].name);
    }
  };

  const handleMovieChange = (mId) => {
    setSelectedMovieId(mId);
    const chosenMovie = movies.find((m) => m._id === mId);
    if (chosenMovie && startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + (chosenMovie.duration + 20) * 60 * 1000);
      setEndTime(end.toISOString().slice(0, 16));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        movie: selectedMovieId,
        theatre: selectedTheatreId,
        screen: selectedScreen,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        format,
        prices: {
          premium: Number(pricePremium),
          regular: Number(priceRegular),
          economy: Number(priceEconomy),
        },
      };

      await API.post('/shows', payload);
      toast.success('Show scheduled & 120 seats generated automatically!');
      setShowModal(false);
      fetchShowsData();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show (possible schedule overlap)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Delete this show? All 120 associated seats will also be deleted.')) return;

    try {
      await API.delete(`/shows/${id}`);
      toast.success('Show deleted');
      setShows((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete show');
    }
  };

  const currentTheatreObj = theatres.find((t) => t._id === selectedTheatreId);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-calendar3 text-warning me-2"></i>
            Showtimes & Seat Engine
          </h3>
          <p className="text-secondary small mb-0">
            Schedule movie screenings with screen conflict safety and automatic seat generation.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </Link>
          <button onClick={openAddModal} className="btn btn-sm btn-cinema">
            <i className="bi bi-plus-lg me-1"></i> Schedule New Show
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading show schedules..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchShowsData} />
      ) : (
        <div className="cinema-card-plain p-4 rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>Movie</th>
                  <th>Theatre</th>
                  <th>Screen & Format</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Tier Pricing</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="fw-bold text-white">{s.movie?.title || 'Untitled'}</div>
                    </td>
                    <td>
                      <div className="text-light">{s.theatre?.name}</div>
                      <div className="text-muted small">{s.theatre?.city}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary me-1">{s.format || '2D'}</span>
                      <span className="small text-secondary">{s.screen}</span>
                    </td>
                    <td>
                      <div className="text-warning fw-semibold small">
                        {new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="fw-bold fs-6">
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="small text-muted">
                      {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary" style={{ fontSize: '0.72rem' }}>
                        P: ₹{s.prices?.premium || 350} | R: ₹{s.prices?.regular || 250} | E: ₹{s.prices?.economy || 150}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link to={`/booking/${s._id}`} className="btn btn-outline-success" title="View Seat Layout">
                          <i className="bi bi-grid-3x3"></i>
                        </Link>
                        <button
                          onClick={() => handleDeleteShow(s._id)}
                          className="btn btn-outline-danger"
                          title="Delete Show"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5 fw-bold">Schedule Movie Screening</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">Select Movie</Form.Label>
                <Form.Select
                  value={selectedMovieId}
                  onChange={(e) => handleMovieChange(e.target.value)}
                  required
                  className="bg-dark text-light border-secondary"
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.duration} min • {m.language})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">Select Cinema Hall</Form.Label>
                <Form.Select
                  value={selectedTheatreId}
                  onChange={(e) => handleTheatreChange(e.target.value)}
                  required
                  className="bg-dark text-light border-secondary"
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">Auditorium Screen</Form.Label>
                <Form.Select
                  value={selectedScreen}
                  onChange={(e) => setSelectedScreen(e.target.value)}
                  className="bg-dark text-light border-secondary"
                >
                  {(currentTheatreObj?.screens || [{ name: 'Screen 1' }]).map((scr, idx) => (
                    <option key={idx} value={scr.name}>
                      {scr.name}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">Screening Format</Form.Label>
                <Form.Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-dark text-light border-secondary"
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX 2D">IMAX 2D</option>
                  <option value="IMAX 3D">IMAX 3D</option>
                  <option value="4DX">4DX Motion</option>
                </Form.Select>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="bg-dark text-light border-secondary"
                />
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="small text-secondary">End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="bg-dark text-light border-secondary"
                />
              </div>

              <div className="col-12 pt-3 border-top border-secondary border-opacity-25">
                <div className="text-secondary small fw-bold mb-2">Tier Pricing Configuration (₹)</div>
                <div className="row g-2">
                  <div className="col-4">
                    <Form.Label className="small text-warning">Premium (Rows A-C)</Form.Label>
                    <Form.Control
                      type="number"
                      value={pricePremium}
                      onChange={(e) => setPricePremium(e.target.value)}
                      className="bg-dark text-light border-secondary"
                    />
                  </div>
                  <div className="col-4">
                    <Form.Label className="small text-info">Regular (Rows D-H)</Form.Label>
                    <Form.Control
                      type="number"
                      value={priceRegular}
                      onChange={(e) => setPriceRegular(e.target.value)}
                      className="bg-dark text-light border-secondary"
                    />
                  </div>
                  <div className="col-4">
                    <Form.Label className="small text-secondary">Economy (Rows I-J)</Form.Label>
                    <Form.Control
                      type="number"
                      value={priceEconomy}
                      onChange={(e) => setPriceEconomy(e.target.value)}
                      className="bg-dark text-light border-secondary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-cinema btn-sm">
              {submitting ? 'Generating Seats...' : 'Publish Show'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminShowsPage;
