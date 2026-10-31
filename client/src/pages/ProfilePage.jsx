import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const payload = { name, phone };

      if (newPassword) {
        if (!currentPassword) {
          toast.error('Please enter your current password to set a new password');
          setIsUpdating(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('New password must be at least 6 characters');
          setIsUpdating(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('New passwords do not match');
          setIsUpdating(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await dispatch(updateProfile(payload)).unwrap();
      toast.success('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '680px' }}>
      <div className="cinema-card-plain p-4 p-md-5 rounded-4 text-white">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div
            className="rounded-circle bg-danger text-white fw-bold d-flex align-items-center justify-content-center shadow"
            style={{ width: '60px', height: '60px', fontSize: '1.6rem' }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="fw-bold text-white mb-0">{user?.name}</h4>
            <div className="text-secondary small">{user?.email}</div>
            <span className={`badge ${user?.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'} mt-1`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <h6 className="text-light fw-bold mb-3">General Information</h6>

          <div className="mb-3">
            <label className="form-label small text-secondary">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control bg-dark text-light border-secondary"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small text-secondary">Email Address (Read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="form-control bg-dark text-muted border-secondary opacity-75"
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="form-control bg-dark text-light border-secondary"
            />
          </div>

          <h6 className="text-light fw-bold mb-3 pt-3 border-top border-secondary border-opacity-25">
            Security & Password
          </h6>

          <div className="mb-3">
            <label className="form-label small text-secondary">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to change"
              className="form-control bg-dark text-light border-secondary"
            />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6">
              <label className="form-label small text-secondary">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="form-control bg-dark text-light border-secondary"
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label small text-secondary">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="form-control bg-dark text-light border-secondary"
              />
            </div>
          </div>

          <button type="submit" disabled={isUpdating} className="btn btn-cinema px-4 py-2 fw-semibold">
            {isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
