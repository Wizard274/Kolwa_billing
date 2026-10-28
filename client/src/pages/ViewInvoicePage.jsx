import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Edit,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Trash2
} from 'lucide-react';
import { invoiceService } from '../services/api.js';
import { InvoiceSheet } from '../components/InvoiceSheet.jsx';
import { downloadInvoicePdf } from '../utils/pdfExport.js';
import { ConfirmationModal } from '../components/ConfirmationModal.jsx';

export const ViewInvoicePage = () => {
  const { id: companyId, billId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoiceById(billId);
      setInvoice(res.invoice);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [billId]);


  const handleDownloadPdf = async () => {
    if (!invoice) return;
    const compName = invoice.companySnapshot?.name || 'Kolwa';
    const filename = `${compName.replace(/\s+/g, '-')}-${invoice.invoiceNumber}.pdf`;
    await downloadInvoicePdf('invoice-print-area', filename);
  };

  const handleIssueDraft = async () => {
    if (!window.confirm('Are you sure you want to officially issue this draft bill? It will be assigned a permanent sequential bill number.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await invoiceService.issueDraftInvoice(billId);
      setInvoice(res.invoice);
      alert(`Bill officially issued as ${res.invoice.invoiceNumber}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue draft bill.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      alert('Please provide a reason for cancelling this invoice.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await invoiceService.voidInvoice(billId, voidReason);
      setInvoice(res.invoice);
      setIsVoidModalOpen(false);
      alert(`Invoice ${res.invoice.invoiceNumber} has been safely marked as VOID.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}><h2>Loading invoice...</h2></div>;
  }

  if (error || !invoice) {
    return (
      <div className="main-content">
        <div className="alert alert-error">{error || 'Invoice not found'}</div>
        <Link to={`/company/${companyId}/history`} className="btn btn-outline">Back to Bill History</Link>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Top Controls Bar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Link to={`/company/${companyId}/history`} className="btn btn-outline btn-sm">
          <ArrowLeft size={18} />
          <span>Back to History</span>
        </Link>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {invoice.status === 'draft' && (
            <>
              <Link
                to={`/company/${companyId}/bills/${billId}/edit`}
                className="btn btn-outline"
              >
                <Edit size={18} />
                <span>Edit Draft</span>
              </Link>
              <button
                onClick={handleIssueDraft}
                className="btn btn-primary"
                disabled={actionLoading}
              >
                <CheckCircle size={18} />
                <span>Issue Final Bill</span>
              </button>
            </>
          )}

          {invoice.status === 'issued' && (
            <button
              onClick={() => setIsVoidModalOpen(true)}
              className="btn btn-destructive"
              disabled={actionLoading}
            >
              <XCircle size={18} />
              <span>Cancel / Void Bill</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary"
          >
            <Download size={18} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Prominent Void Notice Banner if Voided */}
      {invoice.status === 'void' && (
        <div className="alert alert-error no-print" style={{ fontSize: '15px', padding: '14px 18px' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>THIS INVOICE IS VOID / CANCELLED</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              Voided on {new Date(invoice.voidedAt).toLocaleString('en-IN')}.
              Reason: <em>"{invoice.voidReason}"</em>.
              Its bill number remains reserved in sequential records for tax auditing.
            </p>
          </div>
        </div>
      )}

      {/* A4 Printable Sheet Display */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
        <InvoiceSheet invoice={invoice} />
      </div>

      {/* Void Confirmation Modal */}
      <ConfirmationModal
        isOpen={isVoidModalOpen}
        title={`Void Invoice ${invoice.invoiceNumber}`}
        message="Cancelling an issued invoice will mark it as VOID in your official records. The bill number will be preserved in the sequence so that no gap is created in your financial audit sequence."
        confirmText="Confirm Void"
        cancelText="Keep Invoice Active"
        isDestructive={true}
        onConfirm={handleConfirmVoid}
        onCancel={() => setIsVoidModalOpen(false)}
      >
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">
            Reason for Cancellation <span className="required-star">*</span>
          </label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Order cancelled by buyer / Quantity discrepancy"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            autoFocus
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};
