import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CompanyProvider } from './context/CompanyContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ActiveCompanyBanner } from './components/ActiveCompanyBanner.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CompaniesListPage } from './pages/CompaniesListPage.jsx';
import { AddCompanyPage } from './pages/AddCompanyPage.jsx';
import { EditCompanyPage } from './pages/EditCompanyPage.jsx';
import { CompanyWorkspacePage } from './pages/CompanyWorkspacePage.jsx';
import { CustomerListPage } from './pages/CustomerListPage.jsx';
import { CreateBillPage } from './pages/CreateBillPage.jsx';
import { ViewInvoicePage } from './pages/ViewInvoicePage.jsx';
import { EditDraftBillPage } from './pages/EditDraftBillPage.jsx';
import { BillHistoryPage } from './pages/BillHistoryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading Kolwa Billing System...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <ActiveCompanyBanner />
      {children}
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/companies"
              element={<Navigate to="/" replace />}
            />

            <Route
              path="/company/new"
              element={<Navigate to="/" replace />}
            />

            <Route
              path="/company/:id"
              element={
                <ProtectedLayout>
                  <CompanyWorkspacePage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/edit"
              element={
                <ProtectedLayout>
                  <EditCompanyPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/customers"
              element={
                <ProtectedLayout>
                  <CustomerListPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/bills/new"
              element={
                <ProtectedLayout>
                  <CreateBillPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/bills/:billId"
              element={
                <ProtectedLayout>
                  <ViewInvoicePage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/bills/:billId/edit"
              element={
                <ProtectedLayout>
                  <EditDraftBillPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/company/:id/history"
              element={
                <ProtectedLayout>
                  <BillHistoryPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedLayout>
                  <BillHistoryPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedLayout>
                  <NotFoundPage />
                </ProtectedLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
};

export default App;
