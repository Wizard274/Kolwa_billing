import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  FilePlus2,
  Download,
  Eye,
  Edit,
  Trash2,
  XCircle,
  Calendar,
  IndianRupee,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { invoiceService, customerService, companyService } from '../services/api.js';
import { useCompany } from '../context/CompanyContext.jsx';
import { ConfirmationModal } from '../components/ConfirmationModal.jsx';
import { downloadInvoicePdf } from '../utils/pdfExport.js';
import { InvoiceSheet } from '../components/InvoiceSheet.jsx';

export const BillHistoryPage = () => {
  const { id: routeCompanyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companies, activeCompany, selectCompany } = useCompany();
  const navigate = useNavigate();

  const selectedCompanyId = routeCompanyId || activeCompany?._id || (companies[0]?._id ?? '');

  // Default to current month and year
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1-12
  const currentYearNum = today.getFullYear();

  // Filters State
  const [month, setMonth] = useState(searchParams.get('month') || String(currentMonthNum));
  const [year, setYear] = useState(searchParams.get('year') || String(currentYearNum));
  const [customerFilter, setCustomerFilter] = useState(searchParams.get('customer') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);

  // Data
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalSubtotal: 0, totalTax: 0, totalGrandTotal: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Action States
  const [deletingDraftId, setDeletingDraftId] = useState(null);
  const [voidingInvoice, setVoidingInvoice] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [printingInvoice, setPrintingInvoice] = useState(null);

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  // Load customers for filter
  useEffect(() => {
    if (selectedCompanyId) {
      customerService.getCompanyCustomers(selectedCompanyId).then((res) => {
        setCustomers(res.customers || []);
      }).catch(console.error);
    }
  }, [selectedCompanyId]);

  // Fetch Invoices
  const fetchInvoices = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setError('');

    try {
      const params = {
        month: month || undefined,
        year: year || undefined,
        customer: customerFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 25
      };

      const res = await invoiceService.getCompanyInvoices(selectedCompanyId, params);
      setInvoices(res.invoices || []);
      setSummary(res.summary || { totalSubtotal: 0, totalTax: 0, totalGrandTotal: 0 });
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoice records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedCompanyId, month, year, customerFilter, statusFilter, searchQuery, page]);

  const handleCompanyChange = (newCompId) => {
    selectCompany(newCompId);
    navigate(`/company/${newCompId}/history`);
  };

  const handleDeleteDraft = async () => {
    if (!deletingDraftId) return;
    try {
      await invoiceService.deleteDraftInvoice(deletingDraftId);
      setDeletingDraftId(null);
      fetchInvoices();
      alert('Draft invoice deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete draft invoice.');
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingInvoice || !voidReason.trim()) {
      alert('Please provide a reason for cancelling this invoice.');
      return;
    }
    try {
      await invoiceService.voidInvoice(voidingInvoice._id, voidReason);
      setVoidingInvoice(null);
      setVoidReason('');
      fetchInvoices();
      alert('Invoice cancelled and marked as VOID successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void invoice.');
    }
  };


  const handleDirectDownload = async (inv) => {
    setPrintingInvoice(inv);
    setTimeout(async () => {
      const compName = inv.companySnapshot?.name || 'Kolwa';
      const filename = `${compName.replace(/\s+/g, '-')}-${inv.invoiceNumber}.pdf`;
      await downloadInvoicePdf('history-print-area', filename);
    }, 400);
  };

  const activeCompanyName = companies.find((c) => c._id === selectedCompanyId)?.name || 'Workshop';

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Month-wise Bill History</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Viewing invoices for <strong>{activeCompanyName}</strong> ({month ? months.find((m) => m.value === month)?.label : 'All Months'} {year})
          </p>
        </div>

        <Link
          to={`/company/${selectedCompanyId}/bills/new`}
          className="btn btn-primary"
        >
          <FilePlus2 size={18} />
          <span>+ Create New Bill</span>
        </Link>
      </div>

      {/* Filter Toolbar (Company, Month, Year, Customer, Status, Search) */}
      <div className="card no-print" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: 'var(--primary-color)' }}>
          <Filter size={18} />
          <h3 style={{ fontSize: '16px', margin: 0 }}>Filter & Search Invoices</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* Company Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Company</label>
            <select
              className="form-select"
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Month</label>
            <select
              className="form-select"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Year</label>
            <select
              className="form-select"
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Customer Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Customers</option>
              {customers.map((cust) => (
                <option key={cust._id} value={cust._id}>{cust.name}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Invoices</option>
              <option value="issued">Issued (Active)</option>
              <option value="draft">Drafts Only</option>
              <option value="void">Void / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Free text search bar */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--primary-color)" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Bill Number (e.g. KOLWA-001), Challan No, or Customer Name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Selected Period Actual Monthly Totals Cards */}
      <div className="no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        <div className="card" style={{ padding: '12px 16px', margin: 0, borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Period Total Invoices</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalCount}</div>
        </div>

        <div className="card" style={{ padding: '12px 16px', margin: 0, borderLeft: '4px solid var(--secondary-color)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Taxable Subtotal</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>
            ₹ {(summary.totalSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', margin: 0, borderLeft: '4px solid #8A6D3B' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total GST Collected</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>
            ₹ {(summary.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', margin: 0, borderLeft: '4px solid #1B5E20' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Period Grand Total</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#1B5E20' }}>
            ₹ {(summary.totalGrandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error no-print">
          <AlertTriangle size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <h3>Loading billing records...</h3>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card no-print" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <Receipt size={40} color="var(--border-stitch)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>No Bills Found for Selected Period</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            No invoice records match your current month, year, or search criteria.
          </p>
          <Link
            to={`/company/${selectedCompanyId}/bills/new`}
            className="btn btn-primary"
          >
            <FilePlus2 size={18} />
            <span>+ Create Bill Now</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrapper no-print">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill Number</th>
                  <th>Customer Name</th>
                  <th>Challan No.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const custName = inv.customerSnapshot?.name || inv.customerId?.name || 'Customer';
                  const challanDisplay = inv.challanNumbers?.length > 0
                    ? inv.challanNumbers.join(', ')
                    : (inv.items[0]?.challanNumber || '-');
                  const taxTotal = (inv.sgstAmount || 0) + (inv.cgstAmount || 0) + (inv.igstAmount || 0);

                  return (
                    <tr key={inv._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '19px' }}>
                        <Link
                          to={`/company/${selectedCompanyId}/bills/${inv._id}`}
                          style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600 }}>{custName}</td>
                      <td>{challanDisplay}</td>
                      <td style={{ textAlign: 'right' }}>
                        ₹ {inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ₹ {taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '19px' }}>
                        ₹ {inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${inv.status}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <Link
                            to={`/company/${selectedCompanyId}/bills/${inv._id}`}
                            className="btn btn-sm btn-outline"
                            title="View Bill Details"
                          >
                            <Eye size={18} />
                            <span>View</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDirectDownload(inv)}
                            className="btn btn-sm btn-outline"
                            title="Download PDF"
                          >
                            <Download size={16} />
                            <span>PDF</span>
                          </button>

                          {inv.status === 'draft' && (
                            <>
                              <Link
                                to={`/company/${selectedCompanyId}/bills/${inv._id}/edit`}
                                className="btn btn-sm btn-outline"
                                title="Edit Draft"
                              >
                                <Edit size={18} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setDeletingDraftId(inv._id)}
                                className="btn btn-sm btn-destructive"
                                title="Delete Draft"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}

                          {inv.status === 'issued' && (
                            <button
                              type="button"
                              onClick={() => { setVoidingInvoice(inv); setVoidReason(''); }}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'transparent', color: 'var(--destructive-color)', border: '1px solid var(--destructive-color)' }}
                              title="Void Invoice"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous Page
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '18px', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next Page
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Draft Modal */}
      <ConfirmationModal
        isOpen={!!deletingDraftId}
        title="Delete Draft Invoice?"
        message="Are you sure you want to delete this draft invoice? This action cannot be undone."
        confirmText="Yes, Delete Draft"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteDraft}
        onCancel={() => setDeletingDraftId(null)}
      />

      {/* Void Modal */}
      <ConfirmationModal
        isOpen={!!voidingInvoice}
        title={`Void Invoice ${voidingInvoice?.invoiceNumber}`}
        message="Voiding this bill will mark it as CANCELLED in financial records. The invoice number is preserved in history for audit compliance."
        confirmText="Confirm Void"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmVoid}
        onCancel={() => setVoidingInvoice(null)}
      >
        <div className="form-group" style={{ marginTop: '14px' }}>
          <label className="form-label">Cancellation Reason <span className="required-star">*</span></label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Returned / Duplicate order"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
        </div>
      </ConfirmationModal>

      {/* Printable Sheet for Direct History Print/Download */}
      <div id="history-print-area" style={{ display: printingInvoice ? 'block' : 'none' }}>
        {printingInvoice && <InvoiceSheet invoice={printingInvoice} />}
      </div>
    </div>
  );
};
