import React from 'react';
import { Building2, ArrowRightLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext.jsx';

export const ActiveCompanyBanner = () => {
  const { activeCompany, companies, selectCompany } = useCompany();
  const navigate = useNavigate();

  if (!activeCompany) return null;

  return (
    <div className="workspace-banner no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div className="workspace-active-badge">
          <span className="workspace-active-indicator"></span>
          <span>Active Company:</span>
          <span style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            {activeCompany.name}
          </span>
        </div>

        {activeCompany.gstin ? (
          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            <strong>GSTIN:</strong> {activeCompany.gstin}
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--destructive-color)', fontWeight: 600 }}>
            ⚠️ GSTIN not yet set
          </span>
        )}

        {activeCompany.mobile && (
          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            <strong>Mobile:</strong> {activeCompany.mobile}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={activeCompany._id}
          onChange={(e) => {
            selectCompany(e.target.value);
            navigate(`/company/${e.target.value}`);
          }}
          className="form-select"
          style={{ width: 'auto', minHeight: '34px', fontSize: '13.5px', fontWeight: 600, padding: '4px 10px' }}
          aria-label="Switch active company workspace"
        >
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              Switch to: {c.name}
            </option>
          ))}
        </select>

        <Link
          to={`/company/${activeCompany._id}/bills/new`}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} />
          <span>New Bill</span>
        </Link>
      </div>
    </div>
  );
};
