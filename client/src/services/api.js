import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kolwa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login attempt failure
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('kolwa_token');
        localStorage.removeItem('kolwa_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.token) {
      localStorage.setItem('kolwa_token', res.data.token);
      localStorage.setItem('kolwa_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('kolwa_token');
      localStorage.removeItem('kolwa_user');
      localStorage.removeItem('kolwa_active_company');
    }
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  }
};

// Company API
export const companyService = {
  getCompanies: async () => {
    const res = await api.get('/companies');
    return res.data;
  },
  createCompany: async (companyData) => {
    const res = await api.post('/companies', companyData);
    return res.data;
  },
  getCompanyById: async (id) => {
    const res = await api.get(`/companies/${id}`);
    return res.data;
  },
  updateCompany: async (id, companyData) => {
    const res = await api.patch(`/companies/${id}`, companyData);
    return res.data;
  },
  archiveCompany: async (id) => {
    const res = await api.patch(`/companies/${id}/archive`);
    return res.data;
  },
  getCompanySummary: async (id) => {
    const res = await api.get(`/companies/${id}/invoice-summary`);
    return res.data;
  }
};

// Customer API
export const customerService = {
  getCompanyCustomers: async (companyId, search = '') => {
    const res = await api.get(`/companies/${companyId}/customers`, {
      params: { search }
    });
    return res.data;
  },
  createCompanyCustomer: async (companyId, customerData) => {
    const res = await api.post(`/companies/${companyId}/customers`, customerData);
    return res.data;
  },
  getCustomerById: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },
  updateCustomer: async (id, customerData) => {
    const res = await api.patch(`/customers/${id}`, customerData);
    return res.data;
  },
  archiveCustomer: async (id) => {
    const res = await api.patch(`/customers/${id}/archive`);
    return res.data;
  }
};

// Invoice API
export const invoiceService = {
  getNextBillNumber: async (companyId) => {
    const res = await api.get(`/companies/${companyId}/next-number`);
    return res.data;
  },
  createInvoice: async (companyId, invoiceData) => {
    const res = await api.post(`/companies/${companyId}/invoices`, invoiceData);
    return res.data;
  },
  getCompanyInvoices: async (companyId, params = {}) => {
    const res = await api.get(`/companies/${companyId}/invoices`, { params });
    return res.data;
  },
  getInvoiceById: async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return res.data;
  },
  updateDraftInvoice: async (id, invoiceData) => {
    const res = await api.patch(`/invoices/${id}`, invoiceData);
    return res.data;
  },
  issueDraftInvoice: async (id) => {
    const res = await api.post(`/invoices/${id}/issue`);
    return res.data;
  },
  voidInvoice: async (id, reason) => {
    const res = await api.post(`/invoices/${id}/void`, { reason });
    return res.data;
  },
  deleteDraftInvoice: async (id) => {
    const res = await api.delete(`/invoices/${id}`);
    return res.data;
  }
};
