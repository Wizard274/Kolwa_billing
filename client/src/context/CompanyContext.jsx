import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyService } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCompanies = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await companyService.getCompanies();
      const list = res.companies || [];
      setCompanies(list);

      const savedCompanyId = localStorage.getItem('kolwa_active_company');
      if (savedCompanyId) {
        const found = list.find((c) => c._id === savedCompanyId);
        if (found) {
          setActiveCompany(found);
        } else if (list.length > 0) {
          setActiveCompany(list[0]);
          localStorage.setItem('kolwa_active_company', list[0]._id);
        }
      } else if (list.length > 0) {
        setActiveCompany(list[0]);
        localStorage.setItem('kolwa_active_company', list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [isAuthenticated]);

  const selectCompany = (companyOrId) => {
    const comp = typeof companyOrId === 'string'
      ? companies.find((c) => c._id === companyOrId)
      : companyOrId;

    if (comp) {
      setActiveCompany(comp);
      localStorage.setItem('kolwa_active_company', comp._id);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        selectCompany,
        refreshCompanies: fetchCompanies,
        loading
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
