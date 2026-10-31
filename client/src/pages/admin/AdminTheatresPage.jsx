import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AdminTheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bhopal');
  const [address, setAddress] = useState('');
  const [screens, setScreens] = useState([
    { name: 'Audi 1 (Dolby Atmos)', rows: 10, seatsPerRow: 12 },
    { name: 'Audi 2 (4K Laser)', rows: 10, seatsPerRow: 12 },
  ]);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await API.get('/theatres');
      setTheatres(res.data.theatres || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch theatres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const openAddModal = () => {
    setEditingTheatre(null);
    setName('');
    setCity('Bhopal');
    setAddress('');
    setScreens([
      { name: 'Audi 1 (Dolby Atmos)', rows: 10, seatsPerRow: 12 },
      { name: 'Audi 2 (4K Laser)', rows: 10, seatsPerRow: 12 },
    ]);
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingTheatre(t);
    setName(t.name);
    setCity(t.city);
    setAddress(t.address);
    setScreens(t.screens || []);
    setShowModal(true);
  };

  const addScreenRow = () => {
    setScreens([...screens, { name: `Screen ${screens.length + 1}`, rows: 10, seatsPerRow: 12 }]);
  };

  const removeScreenRow = (idx) => {
    setScreens(screens.filter((_, i) => i !== idx));
  };

  const handleScreenChange = (idx, field, val) => {
    const updated = [...screens];
    updated[idx][field] = val;
    setScreens(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { name, city, address, screens };
      if (editingTheatre) {
        await API.put(`/theatres/${editingTheatre._id}`, payload);
        toast.success('Theatre updated successfully!');
      } else {
        await API.post('/theatres', payload);
        toast.success('Theatre created successfully!');
      }
      setShowModal(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, tName) => {
    if (!window.confirm(`Delete "${tName}"? Associated shows will also be deleted.`)) return;

    try {
      await API.delete(`/theatres/${id}`);
      toast.success('Theatre deleted');
      setTheatres((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-building text-info me-2"></i>
            Theatres & Screens Management
          </h3>
          <p className="text-secondary small mb-0">
            Configure cinemas across Bhopal, Indore, Mumbai, and manage screen capacities.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </Link>
          <button onClick={openAddModal} className="btn btn-sm btn-cinema">
            <i className="bi bi-plus-lg me-1"></i> Add Cinema
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching cinema theatres..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTheatres} />
      ) : (
        <div className="cinema-card-plain p-4 rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>Cinema Name</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>Screens</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {theatres.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="fw-bold text-white">{t.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{t.city}</span>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: '300px' }}>
                      {t.address}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {t.screens?.map((s, idx) => (
                          <span key={idx} className="badge bg-dark border border-secondary" style={{ fontSize: '0.72rem' }}>
                            {s.name} ({s.rows * s.seatsPerRow} seats)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => openEditModal(t)}
                          className="btn btn-outline-info"
                          title="Edit Theatre"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(t._id, t.name)}
                          className="btn btn-outline-danger"
                          title="Delete Theatre"
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

      {/* Add / Edit Theatre Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5 fw-bold">
            {editingTheatre ? `Edit Theatre: ${editingTheatre.name}` : 'Add New Cinema Theatre'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label className="small text-secondary">Cinema Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PVR: Express Mall"
                required
                className="bg-dark text-light border-secondary"
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-4">
                <Form.Label className="small text-secondary">City</Form.Label>
                <Form.Select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-dark text-light border-secondary"
                >
                  <option value="Bhopal">Bhopal</option>
                  <option value="Indore">Indore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                </Form.Select>
              </div>

              <div className="col-12 col-sm-8">
                <Form.Label className="small text-secondary">Physical Address</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mall Name, Road, Area, Pincode"
                  required
                  className="bg-dark text-light border-secondary"
                />
              </div>
            </div>

            <div className="mb-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-light fw-bold">Cinema Screens</span>
                <button
                  type="button"
                  onClick={addScreenRow}
                  className="btn btn-sm btn-outline-info py-0 px-2"
                >
                  <i className="bi bi-plus me-1"></i> Add Screen
                </button>
              </div>

              {screens.map((scr, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center bg-dark p-2 rounded border border-secondary border-opacity-25">
                  <div className="col-6">
                    <input
                      type="text"
                      value={scr.name}
                      onChange={(e) => handleScreenChange(idx, 'name', e.target.value)}
                      placeholder="Audi 1 (Dolby Atmos)"
                      required
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                    />
                  </div>
                  <div className="col-2">
                    <input
                      type="number"
                      value={scr.rows}
                      onChange={(e) => handleScreenChange(idx, 'rows', Number(e.target.value))}
                      placeholder="Rows"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      title="Number of rows (A-J)"
                    />
                  </div>
                  <div className="col-2">
                    <input
                      type="number"
                      value={scr.seatsPerRow}
                      onChange={(e) => handleScreenChange(idx, 'seatsPerRow', Number(e.target.value))}
                      placeholder="Seats/Row"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      title="Seats per row (1-12)"
                    />
                  </div>
                  <div className="col-2 text-end">
                    <button
                      type="button"
                      disabled={screens.length <= 1}
                      onClick={() => removeScreenRow(idx)}
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              ))}
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
              {submitting ? 'Saving...' : editingTheatre ? 'Update Theatre' : 'Create Theatre'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTheatresPage;
