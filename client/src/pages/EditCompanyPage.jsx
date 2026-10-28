import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { companyService } from '../services/api.js';
import { useCompany } from '../context/CompanyContext.jsx';

export const EditCompanyPage = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gstin: '',
    invoicePrefix: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { refreshCompanies, selectCompany } = useCompany();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await companyService.getCompanyById(id);
        const c = res.company;
        setFormData({
          name: c.name,
          mobile: c.mobile || '',
          gstin: c.gstin || '',
          invoicePrefix: c.invoicePrefix || ''
        });
      } catch (err) {
        setError('Failed to load company details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await companyService.updateCompany(id, {
        name: formData.name.trim(),
        address: '',
        mobile: formData.mobile.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        defaultDiscountPercent: 0,
        invoicePrefix: formData.invoicePrefix.trim().toUpperCase()
      });

      setSuccess('Company details updated successfully!');
      await refreshCompanies();
      selectCompany(res.company);
      setTimeout(() => navigate(`/company/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="main-content"><h2>Loading details...</h2></div>;
  }

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to={`/company/${id}`} className="btn btn-outline btn-sm" style={{ marginBottom: '10px' }}>
          <ArrowLeft size={18} />
          <span>Back to Workspace</span>
        </Link>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Edit Company Details</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Update profile information, contact numbers, and GST details for {formData.name}.
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

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Company Name <span className="required-star">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="invoicePrefix">
              Bill Number Prefix <span className="required-star">*</span>
            </label>
            <input
              id="invoicePrefix"
              type="text"
              required
              className="form-input"
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="text"
              className="form-input"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gstin">GSTIN</label>
          <input
            id="gstin"
            type="text"
            className="form-input"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
          />
        </div>

        <div style={{
          padding: '12px 14px',
          backgroundColor: '#FCFBF9',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          marginTop: '10px'
        }}>
          <strong>Audit Safety Note:</strong> Changing these details will apply to new invoices.
          Previously issued invoices preserve their exact historical snapshots for legal tax compliance.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <Link to={`/company/${id}`} className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
