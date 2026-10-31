import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${user.name}'s role from ${user.role} to ${newRole}?`)) return;

    try {
      await API.put(`/admin/users/${user._id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold text-white mb-1">
            <i className="bi bi-people text-danger me-2"></i>
            User Accounts & Permissions ({users.length})
          </h3>
          <p className="text-secondary small mb-0">
            View registered user profiles, contact details, and manage administrator privileges.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchUsers} />
      ) : (
        <div className="cinema-card-plain p-4 rounded-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-end">Role Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-light">{u.email}</td>
                    <td className="small text-secondary">{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="small text-secondary">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className={`btn btn-sm ${
                          u.role === 'admin' ? 'btn-outline-secondary' : 'btn-outline-warning'
                        }`}
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
