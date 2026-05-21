import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword } from '../utils/validators';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './ChangePasswordPage.css';

const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      setLoading(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters, include a capital letter, lowercase letter, and a number');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(oldPassword, newPassword);
      toast.success('Password updated successfully!');
      navigate('/settings');
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };
  const handleGoBack = () => {
        navigate(-1);
  };

  return (
    <div className="change-password-page">
      <button className="back-button" onClick={handleGoBack}>&larr; Go Back</button>
      <h1>Change Password</h1>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit} >
        <div className="form-group-change-password">
            <label htmlFor="oldPassword">Current Password</label>
            <input
                type={showOldPassword ? 'text' : 'password'}
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                />
                <span
                type="button"
                className="toggle-password-visibility"
                onClick={() => setShowOldPassword(!showOldPassword)}
                >
                {showOldPassword ? <FiEye /> : <FiEyeOff />}
                </span>
        </div>

        <div className="form-group-change-password">
            <label htmlFor="newPassword">New Password</label>
            <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                />
                <span
                className="toggle-password-visibility"
                onClick={() => setShowNewPassword(!showNewPassword)}
                >
                {showNewPassword ? <FiEye /> : <FiEyeOff />}
                </span>
        </div>

        <div className="form-group-change-password">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                
                <span
                className="toggle-password-visibility"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                >
                {showConfirmNewPassword ? <FiEye /> : <FiEyeOff />}
                </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;