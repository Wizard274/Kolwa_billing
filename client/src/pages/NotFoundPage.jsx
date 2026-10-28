import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="main-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '28px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--border-radius-lg)',
        border: '1.5px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <AlertCircle size={44} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Page Not Found</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          The page or invoice you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <Home size={18} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
