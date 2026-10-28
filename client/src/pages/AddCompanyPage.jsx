import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { companyService } from '../services/api.js';
import { useCompany } from '../context/CompanyContext.jsx';

export const AddCompanyPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gstin: '',
    invoicePrefix: '',
    nextInvoiceSequence: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshCompanies, selectCompany } = useCompany();
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    const val = e.target.value;
    // Auto-generate a readable prefix if user hasn't explicitly customized it
    const suggestedPrefix = val.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
    setFormData((prev) => ({
      ...prev,
      name: val,
      invoicePrefix: prev.invoicePrefix && prev.invoicePrefix !== ''
        ? prev.invoicePrefix
        : (suggestedPrefix ? `${suggestedPrefix}-` : '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a company name.');
      return;
    }

    if (!formData.invoicePrefix.trim()) {
      setError('Please provide an invoice number prefix (e.g. KOLWA-).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await companyService.createCompany({
        name: formData.name.trim(),
        address: '',
        mobile: formData.mobile.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        defaultDiscountPercent: 0,
        invoicePrefix: formData.invoicePrefix.trim().toUpperCase(),
        nextInvoiceSequence: Number(formData.nextInvoiceSequence) || 1
      });

      await refreshCompanies();
      selectCompany(res.company);
      navigate(`/company/${res.company._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '10px' }}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Add New Workshop Company</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Create a new company entity. It will have its own independent bill numbering sequence and customer list.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="company-name">
            Company Name <span className="required-star">*</span>
          </label>
          <input
            id="company-name"
            type="text"
            required
            className="form-input"
            placeholder="e.g. Kolwa Embroidery Works"
            value={formData.name}
            onChange={handleNameChange}
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="invoice-prefix">
              Bill Number Prefix <span className="required-star">*</span>
            </label>
            <input
              id="invoice-prefix"
              type="text"
              required
              className="form-input"
              placeholder="e.g. KOLWA-"
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
            />
            <span className="form-helper">Invoices will be numbered like KOLWA-001, KOLWA-002</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="starting-seq">
              Starting Bill Number
            </label>
            <input
              id="starting-seq"
              type="number"
              min="1"
              className="form-input"
              value={formData.nextInvoiceSequence}
              onChange={(e) => setFormData({ ...formData, nextInvoiceSequence: e.target.value })}
            />
            <span className="form-helper">Defaults to 1 (001)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="text"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gstin">GSTIN (Optional)</label>
            <input
              id="gstin"
              type="text"
              className="form-input"
              placeholder="e.g. 24AAAAA0000A1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
            />
          </div>
        </div>



        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <Link to="/" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} />
            <span>{loading ? 'Creating...' : 'Save & Open Company'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
