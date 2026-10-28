import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FilePlus2,
  Plus,
  Trash2,
  Save,
  Download,
  Eye,
  X,
  AlertTriangle,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { companyService, customerService, invoiceService } from '../services/api.js';
import { AddCustomerModal } from '../components/AddCustomerModal.jsx';
import { useCompany } from '../context/CompanyContext.jsx';
import { downloadInvoicePdf } from '../utils/pdfExport.js';
import { InvoiceSheet } from '../components/InvoiceSheet.jsx';

export const CreateBillPage = () => {
  const { id: companyId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer');
  const navigate = useNavigate();
  const { selectCompany } = useCompany();

  // Company and Customers
  const [company, setCompany] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Section A: Bill Info
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [previewNumber, setPreviewNumber] = useState('Loading...');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');

  // Section B: Customer snapshot fields (auto-filled, editable per bill)
  const [customerSnapshot, setCustomerSnapshot] = useState({
    name: '',
    address: '',
    gstin: '',
    mobile: ''
  });

  // Section C: Itemized embroidery work
  const [items, setItems] = useState([
    { challanNumber: '', description: '', quantity: '', rate: '', lineTotal: 0 }
  ]);

  // Section D: Discount & GST
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'manual'
  const [discountPercent, setDiscountPercent] = useState('');
  const [manualDiscountAmount, setManualDiscountAmount] = useState(0);
  const [taxMode, setTaxMode] = useState('intrastate'); // 'intrastate' (CGST+SGST) or 'interstate' (IGST)
  const [sgstRate, setSgstRate] = useState(2.5);
  const [cgstRate, setCgstRate] = useState(2.5);
  const [igstRate, setIgstRate] = useState(5.0);

  // Notes
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [lastSavedSignature, setLastSavedSignature] = useState(null);
  const [duplicateNotice, setDuplicateNotice] = useState(null);

  // Initial load
  useEffect(() => {
    const loadCompanyAndCustomers = async () => {
      setLoading(true);
      try {
        const [compRes, custRes, numRes] = await Promise.all([
          companyService.getCompanyById(companyId),
          customerService.getCompanyCustomers(companyId),
          invoiceService.getNextBillNumber(companyId)
        ]);

        setCompany(compRes.company);
        selectCompany(compRes.company);
        setCustomers(custRes.customers || []);
        setPreviewNumber(numRes.nextInvoiceNumber);
        setCustomInvoiceNumber(numRes.nextInvoiceNumber);

        // Preselect customer if in query param
        if (preselectedCustomerId) {
          const match = custRes.customers.find((c) => c._id === preselectedCustomerId);
          if (match) {
            handleCustomerChange(match._id, custRes.customers);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize bill form.');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyAndCustomers();
  }, [companyId]);

  // When customer changes, populate Section B customer snapshot & default discount
  const handleCustomerChange = (custId, customerList = customers) => {
    setSelectedCustomerId(custId);
    const found = customerList.find((c) => c._id === custId);
    if (found) {
      setCustomerSnapshot({
        name: found.name,
        address: found.address || '',
        gstin: found.gstin || '',
        mobile: found.mobile || ''
      });
      if (found.defaultDiscountPercent > 0) {
        setDiscountPercent(String(found.defaultDiscountPercent));
      } else {
        setDiscountPercent('');
      }
    } else {
      setCustomerSnapshot({ name: '', address: '', gstin: '', mobile: '' });
    }
  };

  const handleCustomerCreated = (newCust) => {
    setCustomers((prev) => [newCust, ...prev]);
    handleCustomerChange(newCust._id, [newCust, ...customers]);
  };

  // Section C: Line Item Changes
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // Line total recalculation
    const qty = Number(updated[index].quantity) || 0;
    const rate = Number(updated[index].rate) || 0;
    updated[index].lineTotal = Math.round((qty * rate + Number.EPSILON) * 100) / 100;

    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        challanNumber: prev[prev.length - 1]?.challanNumber || '',
        description: '',
        quantity: '',
        rate: '',
        lineTotal: 0
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) {
      alert('The bill must contain at least one item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live client-side calculation (authoritatively verified on server)
  const grossAmount = Math.round(
    (items.reduce((acc, curr) => acc + (Number(curr.lineTotal) || 0), 0) + Number.EPSILON) * 100
  ) / 100;

  let discountAmount = 0;
  if (discountType === 'manual') {
    discountAmount = Math.min(Number(manualDiscountAmount) || 0, grossAmount);
  } else {
    discountAmount = Math.round(((grossAmount * (Number(discountPercent) || 0)) / 100 + Number.EPSILON) * 100) / 100;
  }

  const subtotal = Math.max(0, Math.round((grossAmount - discountAmount + Number.EPSILON) * 100) / 100);

  let sgstAmount = 0;
  let cgstAmount = 0;
  let igstAmount = 0;

  if (taxMode === 'interstate') {
    igstAmount = Math.round(((subtotal * (Number(igstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100;
  } else {
    sgstAmount = Math.round(((subtotal * (Number(sgstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100;
    cgstAmount = Math.round(((subtotal * (Number(cgstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100;
  }

  const grandTotal = Math.round((subtotal + sgstAmount + cgstAmount + igstAmount + Number.EPSILON) * 100) / 100;

  // Validation
  const validateForm = () => {
    if (!customInvoiceNumber.trim()) {
      setError('Please enter a Bill Number.');
      return false;
    }
    if (!selectedCustomerId) {
      setError('Please select a customer or add a new customer.');
      return false;
    }
    if (items.length === 0) {
      setError('Please add at least one line item.');
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setError(`Item #${i + 1}: Please enter the embroidery job description.`);
        return false;
      }
      if (items[i].quantity === '' || isNaN(Number(items[i].quantity)) || Number(items[i].quantity) <= 0) {
        setError(`Item #${i + 1}: Quantity is required and must be greater than 0.`);
        return false;
      }
      if (items[i].rate === '' || isNaN(Number(items[i].rate)) || Number(items[i].rate) < 0) {
        setError(`Item #${i + 1}: Rate is required.`);
        return false;
      }
    }
    return true;
  };

  // Save handler: 'save' (issued), 'save_download', or 'draft'
  const handleSaveBill = async (actionType = 'save') => {
    if (submitting) return;
    if (!validateForm()) return;

    setError('');
    setSuccess('');
    setDuplicateNotice(null);

    // Build unique payload signature to check if all details of the bill are identical
    const currentSignature = JSON.stringify({
      invoiceNumber: customInvoiceNumber.trim(),
      customerId: selectedCustomerId,
      invoiceDate: invoiceDate || '',
      status: actionType === 'draft' ? 'draft' : 'issued',
      items: items.map((i) => ({
        ch: (i.challanNumber || '').trim().toLowerCase(),
        desc: i.description.trim().toLowerCase(),
        qty: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0
      })).sort((a, b) => a.ch.localeCompare(b.ch) || a.desc.localeCompare(b.desc) || a.qty - b.qty),
      discountType,
      discountPercent: discountPercent === '' ? 0 : Number(discountPercent),
      manualDiscountAmount: Number(manualDiscountAmount) || 0,
      taxMode
    });

    // If all details of the bill are identical to what was just saved, do not save twice
    if (savedInvoice && lastSavedSignature === currentSignature) {
      if (actionType === 'save_download') {
        setSuccess(`Bill ${savedInvoice.invoiceNumber} is already saved. Downloading PDF...`);
        setTimeout(async () => {
          const filename = `${company?.name || 'Kolwa'}-${savedInvoice.invoiceNumber}.pdf`;
          await downloadInvoicePdf('invoice-print-area', filename);
        }, 300);
        return;
      } else {
        setDuplicateNotice({
          message: `This bill has already been saved as ${savedInvoice.invoiceNumber}. All details are identical, so it will not be saved twice.`,
          invoice: savedInvoice
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        invoiceNumber: customInvoiceNumber.trim(),
        customerId: selectedCustomerId,
        invoiceDate,
        status: actionType === 'draft' ? 'draft' : 'issued',
        customerSnapshot,
        items: items.map((i) => ({
          challanNumber: (i.challanNumber || '').trim(),
          description: i.description.trim(),
          quantity: Number(i.quantity),
          rate: Number(i.rate)
        })),
        discountType,
        discountPercent: discountPercent === '' ? 0 : Number(discountPercent),
        manualDiscountAmount: Number(manualDiscountAmount) || 0,
        taxMode,
        sgstRate: taxMode === 'intrastate' ? Number(sgstRate) : 0,
        cgstRate: taxMode === 'intrastate' ? Number(cgstRate) : 0,
        igstRate: taxMode === 'interstate' ? Number(igstRate) : 0,
        notes: notes.trim()
      };

      const res = await invoiceService.createInvoice(companyId, payload);
      const created = res.invoice;
      setSavedInvoice(created);
      setLastSavedSignature(currentSignature);
      setSuccess(`Bill ${created.invoiceNumber} saved and persisted successfully!`);

      if (actionType === 'save_download') {
        setTimeout(async () => {
          const filename = `${company?.name || 'Kolwa'}-${created.invoiceNumber}.pdf`;
          await downloadInvoicePdf('invoice-print-area', filename);
        }, 500);
      } else {
        setTimeout(() => {
          navigate(`/company/${companyId}/bills/${created._id}`);
        }, 1200);
      }
    } catch (err) {
      // If server detected that all details are identical to an existing bill on this date
      if (err.response?.status === 409 || err.response?.data?.isDuplicate) {
        const dup = err.response.data.invoice;
        if (dup) {
          setSavedInvoice(dup);
          setLastSavedSignature(currentSignature);
          setDuplicateNotice({
            message: err.response.data.message || `A bill with the exact same details is already saved (${dup.invoiceNumber}). Duplicate was not created.`,
            invoice: dup
          });

          if (actionType === 'save_download') {
            setSuccess(`Existing identical bill found (${dup.invoiceNumber}). Downloading PDF...`);
            setTimeout(async () => {
              const filename = `${company?.name || 'Kolwa'}-${dup.invoiceNumber}.pdf`;
              await downloadInvoicePdf('invoice-print-area', filename);
            }, 500);
          }
          return;
        }
      }

      setError(
        err.response?.data?.message ||
        'Saving bill failed. Your entered form data has been preserved. Please check fields and retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Loading bill form...</h2>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Top Breadcrumb & Heading */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <Link to={`/company/${companyId}`} className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={18} />
          <span>Back to {company?.name || 'Workspace'}</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Create Tax Invoice</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Issuing bill for: <strong>{company?.name}</strong> | Next Bill Sequence: <strong>{previewNumber}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={submitting}
              onClick={() => handleSaveBill('draft')}
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error no-print">
          <AlertTriangle size={24} />
          <span>{error}</span>
        </div>
      )}

      {duplicateNotice && (
        <div className="alert alert-warning no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <span>{duplicateNotice.message}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/company/${companyId}/bills/${duplicateNotice.invoice._id}`} className="btn btn-sm btn-outline">
              <Eye size={15} />
              <span>View Bill {duplicateNotice.invoice.invoiceNumber}</span>
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={async () => {
                const filename = `${company?.name || 'Kolwa'}-${duplicateNotice.invoice.invoiceNumber}.pdf`;
                await downloadInvoicePdf('invoice-print-area', filename);
              }}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success no-print">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Bill Form: Step-by-Step Sections */}
      <form onSubmit={(e) => { e.preventDefault(); handleSaveBill('save'); }} className="no-print">
        {/* SECTION A: Bill Information */}
        <div className="card">
          <div className="card-header">
            <h3>Section A: Bill Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Selected Company</label>
              <input
                type="text"
                disabled
                className="form-input"
                value={company?.name || ''}
                style={{ backgroundColor: '#FAF8F5', fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invoiceDate">
                Bill Date <span className="required-star">*</span>
              </label>
              <input
                id="invoiceDate"
                type="date"
                required
                className="form-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="billNumberInput">
                Bill Number <span className="required-star">*</span>
              </label>
              <input
                id="billNumberInput"
                type="text"
                required
                className="form-input"
                value={customInvoiceNumber}
                onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                style={{ fontWeight: 800, color: 'var(--primary-color)' }}
                placeholder="e.g. KI-001"
              />
              <span className="form-helper">Auto-suggested sequence (editable)</span>
            </div>
          </div>
        </div>

        {/* SECTION B: Customer Information */}
        <div className="card">
          <div className="card-header">
            <h3>Section B: Customer Information</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddCustomerOpen(true)}
            >
              <UserPlus size={18} />
              <span>+ Add New Customer</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="customerSelect">
              Select Customer <span className="required-star">*</span>
            </label>
            <select
              id="customerSelect"
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
              style={{ fontWeight: 600 }}
            >
              <option value="">-- Choose registered customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ''} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerId && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: '#FAF8F5',
              padding: '14px',
              borderRadius: 'var(--border-radius-md)',
              border: '1.5px dashed var(--border-stitch)',
              marginTop: '12px'
            }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>To Customer Name:</strong>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px' }}
                  value={customerSnapshot.name}
                  onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, name: e.target.value })}
                />
              </div>

              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Customer Mobile:</strong>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px' }}
                  value={customerSnapshot.mobile}
                  onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, mobile: e.target.value })}
                />
              </div>

              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Customer GSTIN:</strong>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px' }}
                  value={customerSnapshot.gstin}
                  onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, gstin: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Customer Billing Address:</strong>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '4px' }}
                  value={customerSnapshot.address}
                  onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, address: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION C: Itemized Embroidery Work Table */}
        <div className="card">
          <div className="card-header">
            <h3>Section C: Itemized Embroidery Work</h3>
            <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Exact Columns: Challan No. → Description → Quantity → Rate → Total
            </span>
          </div>

          <div className="table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Challan No.</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '14%' }}>Quantity</th>
                  <th style={{ width: '14%' }}>Rate (₹)</th>
                  <th style={{ width: '14%' }}>Total (₹)</th>
                  <th style={{ width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Challan #"
                        value={item.challanNumber}
                        onChange={(e) => handleItemChange(idx, 'challanNumber', e.target.value)}
                        style={{ minHeight: '44px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Saree Zari Coding / Kurti Daman Work"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        style={{ minHeight: '44px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="form-input"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ minHeight: '44px', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="form-input"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        style={{ minHeight: '44px', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '15px', textAlign: 'right' }}>
                      ₹ {item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        title="Remove Item Row"
                      >
                        <Trash2 size={18} color={items.length <= 1 ? '#CCC' : 'var(--destructive-color)'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItemRow}
            >
              <Plus size={16} />
              <span>Add Another Item Row</span>
            </button>
          </div>
        </div>

        {/* SECTION D: Discount and GST Tax Calculation Summary */}
        <div className="card">
          <div className="card-header">
            <h3>Section D: Discount & GST Tax Calculation</h3>
            <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Real-time calculation summary (paise rounded)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Tax Settings & Discount Mode Controls */}
            <div>
              <div className="form-group">
                <label className="form-label">GST Tax Mode</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="taxMode"
                      value="intrastate"
                      checked={taxMode === 'intrastate'}
                      onChange={() => setTaxMode('intrastate')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Intrastate (CGST 2.5% + SGST 2.5%)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="taxMode"
                      value="interstate"
                      checked={taxMode === 'interstate'}
                      onChange={() => setTaxMode('interstate')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Interstate (IGST 5%)</span>
                  </label>
                </div>
              </div>

              {/* Tax Rates Configuration */}
              {taxMode === 'intrastate' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">SGST Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      value={sgstRate}
                      onChange={(e) => setSgstRate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CGST Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      value={cgstRate}
                      onChange={(e) => setCgstRate(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">IGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={igstRate}
                    onChange={(e) => setIgstRate(e.target.value)}
                  />
                </div>
              )}

              {/* Discount Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="manual">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                  </label>
                  {discountType === 'percentage' ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-input"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={manualDiscountAmount}
                      onChange={(e) => setManualDiscountAmount(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label">Invoice Notes / Terms</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional terms or delivery notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Strict Summary Calculation in Exact Order */}
            <div className="calc-summary-card">
              <div className="calc-row">
                <span>Gross Amount</span>
                <strong>₹ {grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>

              <div className="calc-row">
                <span>Discount {discountType === 'percentage' && discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                <span style={{ color: 'var(--destructive-color)', fontWeight: 600 }}>
                  - ₹ {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="calc-row" style={{ fontWeight: 700, backgroundColor: '#FAF8F5', padding: '10px' }}>
                <span>Subtotal</span>
                <span>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {taxMode === 'intrastate' ? (
                <>
                  <div className="calc-row">
                    <span>SGST ({sgstRate}%)</span>
                    <span>₹ {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="calc-row">
                    <span>CGST ({cgstRate}%)</span>
                    <span>₹ {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div className="calc-row">
                  <span>IGST ({igstRate}%)</span>
                  <span>₹ {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="calc-row grand-total">
                <span>Grand Total</span>
                <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>



        {/* SECTION F: Action Buttons */}
        <div className="card" style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 90,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
          padding: '12px 18px',
          margin: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <Link to={`/company/${companyId}`} className="btn btn-outline">
              <X size={18} />
              <span>Cancel</span>
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={() => handleSaveBill('save_download')}
            >
              <Download size={18} />
              <span>{submitting ? 'Saving...' : 'Save & Download PDF'}</span>
            </button>

            <button
              type="submit"
              className="btn btn-outline"
              disabled={submitting}
            >
              <Save size={18} />
              <span>{submitting ? 'Saving...' : 'Save Bill'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Hidden/Live printable invoice sheet for instant print and PDF download */}
      <div style={{ display: savedInvoice ? 'block' : 'none' }}>
        {savedInvoice && <InvoiceSheet invoice={savedInvoice} />}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        companyId={companyId}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};
