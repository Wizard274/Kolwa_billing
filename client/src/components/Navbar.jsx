import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FilePlus2,
  History,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompany } from '../context/CompanyContext.jsx';

export const Navbar = () => {
  const { logout, user } = useAuth();
  const { activeCompany } = useCompany();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <header className="top-navbar no-print">
      <Link to="/" className="brand-section" title="Kolwa Embroidery Billing System">
        <div className="brand-logo">K</div>
        <div>
          <div className="brand-title">Kolwa Embroidery</div>
          <div className="brand-subtitle">GST Billing & Workshop Invoicing</div>
        </div>
      </Link>

      <nav aria-label="Main Navigation">
        <ul className="nav-links">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {activeCompany && (
            <>
              <li>
                <NavLink
                  to={`/company/${activeCompany._id}/customers`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Users size={17} />
                  <span>Customers</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={`/company/${activeCompany._id}/bills/new`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <FilePlus2 size={17} />
                  <span>Create New Bill</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={`/company/${activeCompany._id}/history`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <History size={17} />
                  <span>Bill History</span>
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Settings size={17} />
              <span>Settings</span>
            </NavLink>
          </li>

          <li>
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Log out of application"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};
