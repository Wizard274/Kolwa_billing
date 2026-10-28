import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  FilePlus2,
  Receipt,
  CalendarDays,
  Users,
  Edit,
  Phone,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { companyService } from '../services/api.js';
import { useCompany } from '../context/CompanyContext.jsx';

export const CompanyWorkspacePage = () => {
  const { id } = useParams();
  const { selectCompany } = useCompany();
  const [company, setCompany] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [compRes, sumRes] = await Promise.all([
          companyService.getCompanyById(id),
          companyService.getCompanySummary(id)
        ]);
        setCompany(compRes.company);
        setSummary(sumRes.summary);
        selectCompany(compRes.company);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load company workspace.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Loading workspace...</h3>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="main-content">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error || 'Company not found'}</span>
        </div>
        <Link to="/" className="btn btn-outline btn-sm">Back to Dashboard</Link>
      </div>
    );
  }

  const isMissingDetails = !company.gstin || !company.address || !company.mobile;

  return (
    <div className="main-content">
      {/* Company Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #6F4938 0%, #5A3A2C 100%)',
        color: '#FFFFFF',
        padding: '22px 24px',
        marginBottom: '20px',
        borderRadius: 'var(--border-radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
              <Building2 size={14} />
              WORKSPACE
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '24px', margin: '0 0 4px' }}>
              {company.name}
            </h1>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
              Independent Bill Sequence Prefix: <strong>{company.invoicePrefix}</strong>
            </p>
          </div>

          <Link
            to={`/company/${company._id}/edit`}
            className="btn btn-sm"
            style={{ backgroundColor: '#FFFFFF', color: 'var(--primary-color)' }}
          >
            <Edit size={16} />
            <span>Edit Company Details</span>
          </Link>
        </div>

        {/* Missing detail notification */}
        {isMissingDetails && (
          <div style={{
            marginTop: '14px',
            backgroundColor: 'rgba(255, 235, 230, 0.95)',
            color: '#8A2B1A',
            padding: '8px 14px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>
              Invoice details notice: Address, Mobile, or GSTIN are empty. You can still issue bills, but updating them ensures full tax compliance.
            </span>
          </div>
        )}
      </div>

      {/* Main Actions Grid */}
      <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Main Workshop Actions</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <Link
          to={`/company/${company._id}/bills/new`}
          className="btn btn-primary"
          style={{ minHeight: '46px', fontSize: '15px' }}
        >
          <FilePlus2 size={20} />
          <span>Create New Bill</span>
        </Link>

        <Link
          to={`/company/${company._id}/history`}
          className="btn btn-secondary"
          style={{ minHeight: '46px', fontSize: '15px' }}
        >
          <Receipt size={20} />
          <span>View All Bills</span>
        </Link>

        <Link
          to={`/company/${company._id}/history?view=month`}
          className="btn btn-outline"
          style={{ minHeight: '46px', fontSize: '15px', borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}
        >
          <CalendarDays size={20} />
          <span>Month-wise Bills</span>
        </Link>

        <Link
          to={`/company/${company._id}/customers`}
          className="btn btn-outline"
          style={{ minHeight: '46px', fontSize: '15px' }}
        >
          <Users size={20} />
          <span>Manage Customers</span>
        </Link>
      </div>

      {/* Details & Live Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
        {/* Company Profile Card */}
        <div className="card">
          <div className="card-header">
            <h3>Company Information</h3>
            <Link to={`/company/${company._id}/edit`} className="btn btn-sm btn-outline">
              <Edit size={14} />
              <span>Edit</span>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14.5px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Building2 size={18} color="var(--primary-color)" />
              <div>
                <strong>Company Name:</strong>
                <p style={{ margin: 0 }}>{company.name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Phone size={18} color="var(--primary-color)" />
              <div>
                <strong>Mobile Number:</strong>
                <p style={{ margin: 0, color: company.mobile ? 'inherit' : 'var(--text-muted)' }}>
                  {company.mobile || 'Mobile not yet specified'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <FileText size={18} color="var(--primary-color)" />
              <div>
                <strong>GSTIN:</strong>
                <p style={{ margin: 0, color: company.gstin ? 'inherit' : 'var(--text-muted)' }}>
                  {company.gstin || 'GSTIN not yet specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Actual Month Statistics */}
        <div className="card" style={{ backgroundColor: '#FCFBF9' }}>
          <div className="card-header">
            <h3>Billing Activity</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time database stats</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Bills</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-color)' }}>
                {summary?.todayBills ?? 0}
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>This Month's Bill Count</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary-color)' }}>
                {summary?.monthBills ?? 0}
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>This Month's Billing Total</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#B8860B' }}>
                ₹ {(summary?.monthTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
