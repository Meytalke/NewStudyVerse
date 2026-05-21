import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword } from '../utils/validators';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { resetPassword, resetPasswordLoading, resetPasswordError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters and include a capital letter, lowercase letter, and a number.');
      return;
    }

    try {
      await resetPassword(token, newPassword, confirmNewPassword);
      toast.success('Password reset successfully. You can now log in with your new password.');
      navigate('/login');
    } catch (error) {
      let errorMessage = 'Failed to reset password. Please try again or request a new link.';
      if (resetPasswordError === 'Invalid or expired password reset token.') {
        errorMessage = 'This password reset link is invalid or has expired. Please request a new password reset link.';
      }
      toast.error(errorMessage);
    }
  };

  return (
    <div className="reset-password-page">
      <h1>Reset Your Password</h1>
      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="form-group-reset-page">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group-reset-page">
          <label htmlFor="confirmNewPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={resetPasswordLoading}>
          {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        {resetPasswordError && <div className="error-message">{resetPasswordError}</div>}
      </form>
    </div>
  );
};

export default ResetPasswordPage;