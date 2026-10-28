import React, { useState } from 'react';
import { Lock, Shield, CheckCircle, AlertCircle, Database, LogOut } from 'lucide-react';
import { authService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Please provide both current and new password.');
      return;
    }
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Your password has been changed successfully! Please remember it for your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Application Settings</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Manage your account credentials, security preferences, and system parameters.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="var(--primary-color)" />
            <h3>Change Administrator Password</h3>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Currently logged in as: <strong>{user?.username}</strong>.
          If you are still using the default demo password (<code>1234</code>), please update it below.
        </p>

        <form onSubmit={handlePasswordChange} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">
              Current Password <span className="required-star">*</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password <span className="required-star">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                required
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password <span className="required-star">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Shield size={18} />
              <span>{loading ? 'Updating Password...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Information Card */}
      <div className="card" style={{ backgroundColor: '#FCFBF9' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--primary-color)" />
            <h3>Database & System Information</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
          <div>
            <strong>Application:</strong> Kolwa Embroidery Billing System v1.0.0 (Production Ready)
          </div>
          <div>
            <strong>Authoritative Database:</strong> MongoDB Atlas Persistent Cluster
          </div>
          <div>
            <strong>Configured Timezone:</strong> Asia/Kolkata (IST, UTC+05:30)
          </div>
          <div>
            <strong>Tax Calculations:</strong> 2-decimal paise exact arithmetic with CGST, SGST & IGST rules
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Sign out of billing system</strong>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>End your current working session safely</p>
          </div>
          <button onClick={handleLogout} className="btn btn-destructive">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
