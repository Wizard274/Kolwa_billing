import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  FilePlus2
} from 'lucide-react';
import { invoiceService, customerService } from '../services/api.js';

export const EditDraftBillPage = () => {
  const { id: companyId, billId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [items, setItems] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [manualDiscountAmount, setManualDiscountAmount] = useState(0);
  const [taxMode, setTaxMode] = useState('intrastate');
  const [sgstRate, setSgstRate] = useState(2.5);
  const [cgstRate, setCgstRate] = useState(2.5);
  const [igstRate, setIgstRate] = useState(5.0);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, custRes] = await Promise.all([
          invoiceService.getInvoiceById(billId),
          customerService.getCompanyCustomers(companyId)
        ]);

        const inv = invRes.invoice;
        if (inv.status !== 'draft') {
          setError('This invoice has already been issued and cannot be edited directly.');
          setLoading(false);
          return;
        }

        setInvoice(inv);
        setCustomers(custRes.customers || []);
        setSelectedCustomerId(inv.customerId?._id || inv.customerId);
        setInvoiceDate(inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '');
        setItems(inv.items || []);
        setDiscountType(inv.discountType || 'percentage');
        setDiscountPercent(inv.discountPercent || 0);
        setManualDiscountAmount(inv.discountAmount || 0);
        setTaxMode(inv.taxMode || 'intrastate');
        setSgstRate(inv.sgstRate ?? 2.5);
        setCgstRate(inv.cgstRate ?? 2.5);
        setIgstRate(inv.igstRate ?? 5.0);
        setNotes(inv.notes || '');
      } catch (err) {
        setError('Failed to load draft bill.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [billId, companyId]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    const qty = Number(updated[index].quantity) || 0;
    const rate = Number(updated[index].rate) || 0;
    updated[index].lineTotal = Math.round((qty * rate + Number.EPSILON) * 100) / 100;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { challanNumber: '', description: '', quantity: 1, rate: 0, lineTotal: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) {
      alert('The bill must contain at least one item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculation
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
  const sgstAmount = taxMode === 'intrastate' ? Math.round(((subtotal * (Number(sgstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100 : 0;
  const cgstAmount = taxMode === 'intrastate' ? Math.round(((subtotal * (Number(cgstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100 : 0;
  const igstAmount = taxMode === 'interstate' ? Math.round(((subtotal * (Number(igstRate) || 0)) / 100 + Number.EPSILON) * 100) / 100 : 0;
  const grandTotal = Math.round((subtotal + sgstAmount + cgstAmount + igstAmount + Number.EPSILON) * 100) / 100;

  const handleSave = async (shouldIssue = false) => {
    setSaving(true);
    setError('');

    try {
      await invoiceService.updateDraftInvoice(billId, {
        customerId: selectedCustomerId,
        invoiceDate,
        items,
        discountType,
        discountPercent: Number(discountPercent) || 0,
        manualDiscountAmount: Number(manualDiscountAmount) || 0,
        taxMode,
        sgstRate: taxMode === 'intrastate' ? Number(sgstRate) : 0,
        cgstRate: taxMode === 'intrastate' ? Number(cgstRate) : 0,
        igstRate: taxMode === 'interstate' ? Number(igstRate) : 0,
        notes: notes.trim()
      });

      if (shouldIssue) {
        const issueRes = await invoiceService.issueDraftInvoice(billId);
        alert(`Draft officially issued as ${issueRes.invoice.invoiceNumber}!`);
        navigate(`/company/${companyId}/bills/${billId}`);
      } else {
        alert('Draft changes saved successfully.');
        navigate(`/company/${companyId}/bills/${billId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update draft bill.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="main-content"><h2>Loading draft...</h2></div>;
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="alert alert-error">{error}</div>
        <Link to={`/company/${companyId}/bills/${billId}`} className="btn btn-outline">Back to Bill</Link>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <Link to={`/company/${companyId}/bills/${billId}`} className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={18} />
          <span>Back to Invoice</span>
        </Link>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Edit Draft Invoice ({invoice.invoiceNumber})</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Update line items, quantities, or discount before finalizing.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Customer & Date</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div className="card">
        <div className="card-header">
          <h3>Itemized Embroidery Work</h3>
        </div>

        <div className="table-wrapper">
          <table className="billing-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Challan No.</th>
                <th style={{ width: '42%' }}>Description</th>
                <th style={{ width: '13%' }}>Quantity</th>
                <th style={{ width: '13%' }}>Rate (₹)</th>
                <th style={{ width: '14%' }}>Total (₹)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      value={item.challanNumber || ''}
                      onChange={(e) => handleItemChange(idx, 'challanNumber', e.target.value)}
                      style={{ minHeight: '44px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      style={{ minHeight: '44px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{ minHeight: '44px', textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      style={{ minHeight: '44px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    ₹ {item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={20} color="var(--destructive-color)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="btn btn-secondary" onClick={addItemRow} style={{ marginTop: '14px' }}>
          <Plus size={20} />
          <span>Add Item Row</span>
        </button>
      </div>

      {/* Summary Box */}
      <div className="card" style={{ maxWidth: '480px', marginLeft: 'auto' }}>
        <div className="calc-row">
          <span>Gross Amount</span>
          <strong>₹ {grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className="calc-row">
          <span>Discount ({discountPercent}%)</span>
          <span style={{ color: 'var(--destructive-color)' }}>- ₹ {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="calc-row" style={{ fontWeight: 'bold' }}>
          <span>Subtotal</span>
          <span>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        {taxMode === 'intrastate' ? (
          <>
            <div className="calc-row"><span>SGST (2.5%)</span><span>₹ {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            <div className="calc-row"><span>CGST (2.5%)</span><span>₹ {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          </>
        ) : (
          <div className="calc-row"><span>IGST (5%)</span><span>₹ {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        )}
        <div className="calc-row grand-total">
          <span>Grand Total</span>
          <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
        <Link to={`/company/${companyId}/bills/${billId}`} className="btn btn-outline">Cancel</Link>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={saving}
          onClick={() => handleSave(false)}
        >
          <Save size={22} />
          <span>Save Draft Changes</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          disabled={saving}
          onClick={() => handleSave(true)}
        >
          <CheckCircle size={22} />
          <span>Save & Issue Final Bill</span>
        </button>
      </div>
    </div>
  );
};
