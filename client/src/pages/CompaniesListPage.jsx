import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, PlusCircle, ArrowRight, Phone, FileText, Receipt, Edit } from 'lucide-react';
import { useCompany } from '../context/CompanyContext.jsx';

export const CompaniesListPage = () => {
  const { companies, selectCompany } = useCompany();
  const navigate = useNavigate();

  const handleOpenCompany = (company) => {
    selectCompany(company);
    navigate(`/company/${company._id}`);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Workshop Companies</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Manage distinct business entities, sequences, and billing profiles.
        </p>
      </div>

      <div className="companies-grid">
        {companies.map((company) => (
          <div key={company._id} className="company-card">
            <div>
              <div className="company-card-header" style={{ marginBottom: '14px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={24} color="var(--primary-color)" />
                  <h3 className="company-card-title" style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--primary-color)' }}>
                    {company.name}
                  </h3>
                </div>
              </div>

              <div className="company-card-info" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <span><strong>Mobile:</strong> {company.mobile || 'Not set'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--text-muted)" />
                  <span><strong>GSTIN:</strong> {company.gstin || 'Not set'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={16} color="var(--text-muted)" />
                  <span><strong>Bills:</strong> {company.stats?.totalBills ?? 0}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => handleOpenCompany(company)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <span>Open Workspace</span>
                <ArrowRight size={18} />
              </button>
              <Link
                to={`/company/${company._id}/edit`}
                className="btn btn-outline"
                style={{ padding: '8px 12px' }}
                title="Edit Details"
              >
                <Edit size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
