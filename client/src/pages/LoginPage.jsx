import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [username, setUsername] = useState('Kolwa');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to log in. Please check your credentials and make sure the server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '28px 24px',
        boxShadow: 'var(--shadow-md)',
        border: '1.5px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)'
      }}>
        {/* Embroidery Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: '800',
            border: '2px dashed var(--secondary-color)',
            marginBottom: '10px'
          }}>
            K
          </div>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Kolwa Embroidery</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Billing & Invoicing Workshop System
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              <User size={16} color="var(--primary-color)" />
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Kolwa"
            />
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label" htmlFor="password">
              <Lock size={16} color="var(--primary-color)" />
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. 1234"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Billing</span>
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '10px 14px',
          backgroundColor: '#FAF8F5',
          borderRadius: 'var(--border-radius-md)',
          border: '1px dashed var(--border-stitch)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          <strong>Demo Access:</strong> Username: <code>Kolwa</code> | Password: <code>1234</code>
        </div>
      </div>
    </div>
  );
};
