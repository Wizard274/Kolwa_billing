import React, { forwardRef } from 'react';

export const InvoiceSheet = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;

  // Company and customer resolution with safe fallback to populated ref if snapshot was partial
  const companySnapshot = invoice.companySnapshot || {};
  const companyRef = typeof invoice.companyId === 'object' && invoice.companyId !== null ? invoice.companyId : {};

  const companyName = (companySnapshot.name || companyRef.name || 'Kolwa Embroidery').trim();
  const companyMobile = (companySnapshot.mobile || companyRef.mobile || '').trim();
  const companyGstin = (companySnapshot.gstin || companyRef.gstin || '').trim();

  const customerSnapshot = invoice.customerSnapshot || {};
  const customerRef = typeof invoice.customerId === 'object' && invoice.customerId !== null ? invoice.customerId : {};

  const customerName = (customerSnapshot.name || customerRef.name || 'Cash Customer').trim();
  const customerAddress = (customerSnapshot.address || customerRef.address || '').trim();
  const customerMobile = (customerSnapshot.mobile || customerRef.mobile || '').trim();
  const customerGstin = (customerSnapshot.gstin || customerRef.gstin || '').trim();

  const items = invoice.items || [];

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const isInterstate = invoice.taxMode === 'interstate';

  // Extract challans
  const challanList = invoice.challanNumbers?.length > 0
    ? invoice.challanNumbers.join(', ')
    : (items.map((i) => i.challanNumber).filter(Boolean).join(', ') || '-');

  return (
    <div
      ref={ref}
      id="invoice-print-area"
      className="print-invoice-sheet"
      style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        padding: '24px 30px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '14px',
        lineHeight: 1.5,
        boxSizing: 'border-box',
        borderTop: '5px solid #2D2424'
      }}
    >
      {/* 1. Header with Company Details */}
      <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '1.5px solid #E2E8F0', marginBottom: '14px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: '900',
          margin: '0 0 6px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#1E293B'
        }}>
          {companyName}
        </h1>

        {(companyMobile || companyGstin) && (
          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '20px',
              padding: '6px 22px',
              fontSize: '13.5px',
              color: '#334155',
              lineHeight: 1.4
            }}>
              {companyMobile && (
                <span style={{ marginRight: companyGstin ? '18px' : '0' }}>
                  <strong style={{ color: '#0F172A' }}>Mobile:</strong> {companyMobile}
                </span>
              )}
              {companyMobile && companyGstin && (
                <span style={{ color: '#94A3B8', marginRight: '18px' }}>•</span>
              )}
              {companyGstin && (
                <span>
                  <strong style={{ color: '#0F172A' }}>GSTIN:</strong> {companyGstin}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Tax Invoice Title Pill */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#2D2424',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: '800',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          padding: '5px 28px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          TAX INVOICE
        </div>
      </div>

      {/* 3. Customer ("BILL TO") & Bill Metadata Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 1fr',
        border: '1.5px solid #CBD5E1',
        borderRadius: '6px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        marginBottom: '18px'
      }}>
        {/* Bill To Column */}
        <div style={{ padding: '12px 16px', borderRight: '1.5px solid #CBD5E1' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#64748B',
            marginBottom: '6px'
          }}>
            BILL TO
          </div>

          <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
            {customerName}
          </div>

          {customerAddress && (
            <div style={{ fontSize: '13.5px', color: '#334155', marginBottom: '5px', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
              <strong>Address:</strong> {customerAddress}
            </div>
          )}

          {customerMobile && (
            <div style={{ fontSize: '13.5px', color: '#334155', marginBottom: '3px' }}>
              <strong>Mobile:</strong> {customerMobile}
            </div>
          )}

          {customerGstin && (
            <div style={{ fontSize: '13.5px', color: '#334155' }}>
              <strong>GSTIN:</strong> {customerGstin}
            </div>
          )}
        </div>

        {/* Invoice Metadata Column (Status removed per requirement 10) */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #E2E8F0', paddingBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Invoice No:</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#2D2424' }}>
              {invoice.invoiceNumber}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #E2E8F0', paddingBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Date:</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
              {formatDate(invoice.invoiceDate)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Challan No(s):</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
              {challanList}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Itemized Work Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '18px',
        border: '1.5px solid #CBD5E1',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#2D2424', color: '#FFFFFF' }}>
            <th style={{ padding: '9px 12px', width: '16%', textAlign: 'left', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>
              Challan No.
            </th>
            <th style={{ padding: '9px 12px', width: '42%', textAlign: 'left', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>
              Description
            </th>
            <th style={{ padding: '9px 12px', width: '13%', textAlign: 'right', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>
              Quantity
            </th>
            <th style={{ padding: '9px 12px', width: '14%', textAlign: 'right', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>
              Rate (₹)
            </th>
            <th style={{ padding: '9px 12px', width: '15%', textAlign: 'right', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>
              Total (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              style={{
                backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                borderBottom: '1px solid #E2E8F0'
              }}
            >
              <td style={{ borderRight: '1px solid #E2E8F0', padding: '9px 12px', color: '#475569', fontWeight: 600 }}>
                {item.challanNumber || '-'}
              </td>
              <td style={{ borderRight: '1px solid #E2E8F0', padding: '9px 12px', color: '#0F172A', fontWeight: 500, whiteSpace: 'pre-line' }}>
                {item.description}
              </td>
              <td style={{ borderRight: '1px solid #E2E8F0', padding: '9px 12px', textAlign: 'right', color: '#334155' }}>
                {item.quantity}
              </td>
              <td style={{ borderRight: '1px solid #E2E8F0', padding: '9px 12px', textAlign: 'right', color: '#334155' }}>
                {formatCurrency(item.rate)}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                {formatCurrency(item.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. Calculation Summary Table (Exact required order) */}
      <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <table style={{
          width: '330px',
          borderCollapse: 'collapse',
          border: '1.5px solid #CBD5E1',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          fontSize: '14px'
        }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '7px 14px', color: '#475569', fontWeight: 500 }}>Gross Amount</td>
              <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '600', color: '#0F172A' }}>
                ₹ {formatCurrency(invoice.grossAmount)}
              </td>
            </tr>

            {invoice.discountAmount > 0 && (
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '7px 14px', color: '#B91C1C', fontWeight: 500 }}>
                  Discount {invoice.discountPercent > 0 ? `(${invoice.discountPercent}%)` : ''}
                </td>
                <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '600', color: '#B91C1C' }}>
                  - ₹ {formatCurrency(invoice.discountAmount)}
                </td>
              </tr>
            )}

            <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontWeight: '700' }}>
              <td style={{ padding: '7px 14px', color: '#0F172A' }}>Subtotal</td>
              <td style={{ padding: '7px 14px', textAlign: 'right', color: '#0F172A' }}>
                ₹ {formatCurrency(invoice.subtotal)}
              </td>
            </tr>

            {!isInterstate ? (
              <>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 14px', color: '#475569' }}>
                    SGST ({invoice.sgstRate}%)
                  </td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', color: '#334155' }}>
                    ₹ {formatCurrency(invoice.sgstAmount)}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 14px', color: '#475569' }}>
                    CGST ({invoice.cgstRate}%)
                  </td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', color: '#334155' }}>
                    ₹ {formatCurrency(invoice.cgstAmount)}
                  </td>
                </tr>
              </>
            ) : (
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '6px 14px', color: '#475569' }}>
                  IGST ({invoice.igstRate}%)
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', color: '#334155' }}>
                  ₹ {formatCurrency(invoice.igstAmount)}
                </td>
              </tr>
            )}

            <tr style={{ backgroundColor: '#2D2424', color: '#FFFFFF' }}>
              <td style={{ padding: '10px 14px', fontSize: '15px', fontWeight: '800' }}>Grand Total</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px' }}>
                ₹ {formatCurrency(invoice.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Footer and Signature Section */}
      <div className="print-avoid-break" style={{
        marginTop: '36px',
        paddingTop: '18px',
        borderTop: '1.5px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '20px'
      }}>
        <div style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '340px' }}>
          <p style={{ margin: '0 0 3px', fontWeight: 600, color: '#334155' }}>Thank you for your business!</p>
          <p style={{ margin: 0, fontStyle: 'italic' }}>This is an authentic computer generated tax invoice.</p>
        </div>

        <div style={{ textAlign: 'right', minWidth: '240px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', marginBottom: '46px', textTransform: 'uppercase' }}>
            For {companyName}
          </div>
          <div style={{
            borderTop: '1.5px dashed #475569',
            paddingTop: '6px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#334155',
            letterSpacing: '0.5px'
          }}>
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  );
});
