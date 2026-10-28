import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  ArrowRight,
  Receipt,
  Calendar,
  IndianRupee,
  Phone,
  FileText
} from 'lucide-react';
import { useCompany } from '../context/CompanyContext.jsx';

export const DashboardPage = () => {
  const { companies, selectCompany, refreshCompanies } = useCompany();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCompanies();
  }, []);

  const handleOpenCompany = (company) => {
    selectCompany(company);
    navigate(`/company/${company._id}`);
  };

  // Calculate system-wide summary figures from actual DB records
  const totalBillsAcross = companies.reduce((acc, c) => acc + (c.stats?.totalBills || 0), 0);
  const todayBillsAcross = companies.reduce((acc, c) => acc + (c.stats?.todayBills || 0), 0);
  const monthRevenueAcross = companies.reduce((acc, c) => acc + (c.stats?.currentMonthTotal || 0), 0);

  return (
    <div className="main-content">
      {/* Page Title & Greeting */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>
          Embroidery Billing Dashboard
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
          Select a workshop company below to issue bills, manage customers, and view monthly statements.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div className="card" style={{ padding: '14px 16px', margin: 0, borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={22} color="var(--primary-color)" />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Today's Bills Issued
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {todayBillsAcross}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', margin: 0, borderLeft: '4px solid var(--secondary-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={22} color="var(--secondary-color)" />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                All Time Bills Count
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalBillsAcross}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', margin: 0, borderLeft: '4px solid #B8860B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IndianRupee size={22} color="#B8860B" />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Current Month Billing
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹ {monthRevenueAcross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Companies Section */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--primary-color)' }}>
          Your Workshop Companies
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Each business maintains its own independent bill numbering and customer database.
        </p>
      </div>

      {/* Companies Grid */}
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

              <div className="company-card-info" style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="var(--text-muted)" />
                  <span>
                    <strong>Mobile:</strong> {company.mobile || 'Not specified'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} color="var(--text-muted)" />
                  <span>
                    <strong>GSTIN:</strong> {company.gstin || 'Not specified'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <Receipt size={15} color="var(--text-muted)" />
                  <span>
                    <strong>Total Bills:</strong> {company.stats?.totalBills ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenCompany(company)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px' }}
            >
              <span>Open Company</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
