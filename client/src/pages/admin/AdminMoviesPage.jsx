import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [genre, setGenre] = useState('Action, Drama');
  const [duration, setDuration] = useState(140);
  const [rating, setRating] = useState(8.0);
  const [status, setStatus] = useState('nowShowing');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await API.get('/movies?limit=100');
      setMovies(res.data.movies || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setLanguage('Hindi');
    setGenre('Action, Drama');
    setDuration(140);
    setRating(8.0);
    setStatus('nowShowing');
    setTrailerUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setPosterUrl('https://placehold.co/400x600/1e293b/f8fafc?text=Movie+Poster');
    setPosterFile(null);
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditingMovie(m);
    setTitle(m.title);
    setDescription(m.description);
    setLanguage(m.language);
    setGenre(Array.isArray(m.genre) ? m.genre.join(', ') : m.genre);
    setDuration(m.duration);
    setRating(m.rating);
    setStatus(m.status);
    setTrailerUrl(m.trailerUrl || '');
    setPosterUrl(m.poster || '');
    setPosterFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('language', language);
      formData.append('genre', genre);
      formData.append('duration', duration);
      formData.append('rating', rating);
      formData.append('status', status);
      formData.append('trailerUrl', trailerUrl);

      if (posterFile) {
        formData.append('poster', posterFile);
      } else if (posterUrl) {
        formData.append('poster', posterUrl);
      }

      if (editingMovie) {
        await API.put(`/movies/${editingMovie._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Movie updated successfully!');
      } else {
        await API.post('/movies', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Movie created successfully!');
      }

      setShowModal(false);
      fetchMovies();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, mTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${mTitle}"? Associated shows will also be deleted.`)) {
      return;
    }

    try {
      await API.delete(`/movies/${id}`);
      toast.success('Movie deleted successfully');
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete movie');
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-film text-danger me-2"></i>
            Movie Catalogue Management
          </h3>
          <p className="text-secondary small mb-0">
            Create, update, upload posters, or decommission movie titles.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </Link>
          <button onClick={openAddModal} className="btn btn-sm btn-cinema">
            <i className="bi bi-plus-lg me-1"></i> Add New Movie
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading movie catalogue..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMovies} />
      ) : (
        <div className="cinema-card-plain p-4 rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>Poster</th>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Genre</th>
                  <th>Runtime</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id}>
                    <td style={{ width: '60px' }}>
                      <img
                        src={m.poster}
                        alt={m.title}
                        className="rounded"
                        style={{ width: '45px', height: '60px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <div className="fw-bold text-white">{m.title}</div>
                      <div className="text-muted small line-clamp-1" style={{ maxWidth: '280px', fontSize: '0.75rem' }}>
                        {m.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-danger text-uppercase">{m.language}</span>
                    </td>
                    <td>
                      <span className="text-secondary small">
                        {Array.isArray(m.genre) ? m.genre.join(', ') : m.genre}
                      </span>
                    </td>
                    <td className="small">{m.duration} min</td>
                    <td>
                      <span className="text-warning fw-semibold">
                        <i className="bi bi-star-fill me-1"></i>
                        {m.rating ? m.rating.toFixed(1) : '7.5'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'nowShowing' ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {m.status === 'nowShowing' ? 'Now Showing' : 'Upcoming'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => openEditModal(m)}
                          className="btn btn-outline-info"
                          title="Edit Movie"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(m._id, m.title)}
                          className="btn btn-outline-danger"
                          title="Delete Movie"
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

      {/* Add / Edit Movie Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5 fw-bold">
            {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie Title'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Movie Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-12 col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Status</Form.Label>
                  <Form.Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-dark text-light border-secondary"
                  >
                    <option value="nowShowing">Now Showing</option>
                    <option value="upcoming">Upcoming</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Description / Synopsis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-6 col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Language</Form.Label>
                  <Form.Control
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Hindi / English"
                    required
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-6 col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Runtime (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-6 col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Rating (0 - 10)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-6 col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Genres (Comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Action, Thriller"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Trailer URL (YouTube)</Form.Label>
                  <Form.Control
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </div>

              <div className="col-12 col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Upload Poster File (Multer)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files[0])}
                    className="bg-dark text-light border-secondary"
                  />
                  <div className="form-text text-muted small">Max 5MB (JPEG, PNG, WEBP)</div>
                </Form.Group>
              </div>

              <div className="col-12 col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Or Poster Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
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
              {submitting ? 'Saving Movie...' : editingMovie ? 'Update Movie' : 'Create Movie'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminMoviesPage;
