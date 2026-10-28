import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  FileText,
  Percent,
  Edit,
  FilePlus2,
  AlertCircle
} from 'lucide-react';
import { customerService } from '../services/api.js';
import { AddCustomerModal } from '../components/AddCustomerModal.jsx';
import { useCompany } from '../context/CompanyContext.jsx';

export const CustomerListPage = () => {
  const { id } = useParams();
  const { activeCompany } = useCompany();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await customerService.getCompanyCustomers(id, searchQuery);
      setCustomers(res.customers || []);
    } catch (err) {
      setError('Failed to load customer list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [id, search]);

  const handleCustomerCreated = (newCust) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const res = await customerService.updateCustomer(editingCustomer._id, {
        name: editingCustomer.name.trim(),
        address: editingCustomer.address.trim(),
        mobile: editingCustomer.mobile.trim(),
        gstin: editingCustomer.gstin.trim().toUpperCase(),
        defaultDiscountPercent: Number(editingCustomer.defaultDiscountPercent) || 0,
        notes: (editingCustomer.notes || '').trim()
      });

      setCustomers((prev) =>
        prev.map((c) => (c._id === editingCustomer._id ? res.customer : c))
      );
      setEditingCustomer(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer');
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Customer Management</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Customers registered under <strong>{activeCompany?.name || 'Selected Workshop'}</strong>
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
        >
          <UserPlus size={18} />
          <span>+ Add New Customer</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="var(--primary-color)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by customer name, mobile number, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <h3>Loading customers...</h3>
        </div>
      ) : customers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <Users size={40} color="var(--border-stitch)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>No Customers Found</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {search ? 'No customer matches your search criteria.' : 'Add your first customer to quickly populate billing info on invoices.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>+ Add First Customer</span>
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Customer / Business Name</th>
                <th>Mobile Number</th>
                <th>GSTIN</th>
                <th>Default Discount</th>
                <th>Address</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td style={{ fontWeight: 700, fontSize: '15px' }}>
                    {customer.name}
                  </td>
                  <td>{customer.mobile || '-'}</td>
                  <td>{customer.gstin || '-'}</td>
                  <td>{customer.defaultDiscountPercent > 0 ? `${customer.defaultDiscountPercent}%` : '-'}</td>
                  <td style={{ maxWidth: '240px', fontSize: '13.5px' }}>{customer.address || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <Link
                        to={`/company/${id}/bills/new?customer=${customer._id}`}
                        className="btn btn-sm btn-primary"
                        title="Create bill for this customer"
                      >
                        <FilePlus2 size={15} />
                        <span>Bill</span>
                      </Link>

                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="btn btn-sm btn-outline"
                        title="Edit customer details"
                      >
                        <Edit size={15} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={id}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Edit Customer Details</h3>
            <form onSubmit={handleUpdateCustomer}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    GSTIN <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingCustomer.gstin || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingCustomer.mobile || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="form-input"
                  placeholder="Leave blank or enter %"
                  value={editingCustomer.defaultDiscountPercent === 0 ? '' : (editingCustomer.defaultDiscountPercent ?? '')}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, defaultDiscountPercent: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
