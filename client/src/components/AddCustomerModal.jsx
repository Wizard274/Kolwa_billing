import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { customerService } from '../services/api.js';

export const AddCustomerModal = ({ isOpen, onClose, companyId, onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstin: '',
    mobile: '',
    defaultDiscountPercent: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (!formData.gstin.trim()) {
      setError('GSTIN is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await customerService.createCompanyCustomer(companyId, {
        name: formData.name.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        mobile: formData.mobile.trim(),
        defaultDiscountPercent: formData.defaultDiscountPercent !== '' ? Number(formData.defaultDiscountPercent) : 0,
        notes: formData.notes.trim()
      });

      onCustomerCreated(res.customer);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--primary-color)" />
            <h3 style={{ fontSize: '18px', margin: 0 }}>Add New Customer</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label="Close modal"
          >
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Customer / Business Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Surat Sarees Emporium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                GSTIN <span className="required-star">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 24AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Full shop or workshop address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Customer Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-input"
              placeholder="Leave blank or enter %"
              value={formData.defaultDiscountPercent}
              onChange={(e) => setFormData({ ...formData, defaultDiscountPercent: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Customer & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
