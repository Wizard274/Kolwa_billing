/**
 * Calculation service for Kolwa Embroidery Billing System
 * Provides precise financial math, 2-decimal paise rounding, and GST tax calculations.
 */

export const round2 = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates a single item's line total: quantity * rate rounded to 2 decimals
 */
export const calculateLineTotal = (quantity, rate) => {
  const qty = Number(quantity);
  const r = Number(rate);
  if (isNaN(qty) || qty < 0) throw new Error('Quantity must be a non-negative number');
  if (isNaN(r) || r < 0) throw new Error('Rate must be a non-negative number');
  return round2(qty * r);
};

/**
 * Authoritative invoice totals recalculation
 * 
 * @param {Object} params
 * @param {Array} params.items - List of { challanNumber, description, quantity, rate, lineTotal }
 * @param {string} [params.discountType='percentage'] - 'percentage' or 'manual'
 * @param {number} [params.discountPercent=0]
 * @param {number} [params.manualDiscountAmount=0]
 * @param {string} [params.taxMode='intrastate'] - 'intrastate' (CGST+SGST) or 'interstate' (IGST)
 * @param {number} [params.sgstRate=2.5]
 * @param {number} [params.cgstRate=2.5]
 * @param {number} [params.igstRate=0]
 * @returns {Object} Calculated totals and sanitized items
 */
export const calculateInvoiceTotals = ({
  items = [],
  discountType = 'percentage',
  discountPercent = 0,
  manualDiscountAmount = 0,
  taxMode = 'intrastate',
  sgstRate = 2.5,
  cgstRate = 2.5,
  igstRate = 0
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Invoice must have at least one line item');
  }

  // 1. Process items and calculate line totals
  const sanitizedItems = items.map((item, index) => {
    const qty = Number(item.quantity);
    const r = Number(item.rate);

    if (isNaN(qty) || qty < 0) {
      throw new Error(`Item ${index + 1}: Quantity must be a non-negative number`);
    }
    if (isNaN(r) || r < 0) {
      throw new Error(`Item ${index + 1}: Rate must be a non-negative number`);
    }

    const lineTotal = round2(qty * r);
    return {
      challanNumber: (item.challanNumber || '').trim(),
      description: (item.description || '').trim(),
      quantity: qty,
      rate: r,
      lineTotal
    };
  });

  // 2. Gross Amount = sum of all line totals
  const grossAmount = round2(
    sanitizedItems.reduce((acc, curr) => acc + curr.lineTotal, 0)
  );

  // 3. Discount Amount
  let discountAmt = 0;
  let finalDiscountPercent = 0;

  if (discountType === 'manual') {
    const manualAmt = Number(manualDiscountAmount) || 0;
    if (manualAmt < 0) throw new Error('Discount amount cannot be negative');
    discountAmt = round2(Math.min(manualAmt, grossAmount));
    finalDiscountPercent = grossAmount > 0 ? round2((discountAmt / grossAmount) * 100) : 0;
  } else {
    const discPct = Number(discountPercent) || 0;
    if (discPct < 0 || discPct > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    finalDiscountPercent = discPct;
    discountAmt = round2((grossAmount * discPct) / 100);
  }

  // 4. Subtotal = gross - discount
  const subtotal = round2(Math.max(0, grossAmount - discountAmt));

  // 5. Taxes
  // Rule: For intrastate, apply CGST and SGST; for interstate, apply IGST.
  // Prevent simultaneous application of IGST and CGST/SGST.
  let finalSgstRate = 0;
  let finalSgstAmount = 0;
  let finalCgstRate = 0;
  let finalCgstAmount = 0;
  let finalIgstRate = 0;
  let finalIgstAmount = 0;

  if (taxMode === 'interstate') {
    finalIgstRate = Number(igstRate) >= 0 ? Number(igstRate) : 5.0;
    finalIgstAmount = round2((subtotal * finalIgstRate) / 100);
    finalSgstRate = 0;
    finalSgstAmount = 0;
    finalCgstRate = 0;
    finalCgstAmount = 0;
  } else {
    // intrastate
    finalSgstRate = Number(sgstRate) >= 0 ? Number(sgstRate) : 2.5;
    finalCgstRate = Number(cgstRate) >= 0 ? Number(cgstRate) : 2.5;
    finalSgstAmount = round2((subtotal * finalSgstRate) / 100);
    finalCgstAmount = round2((subtotal * finalCgstRate) / 100);
    finalIgstRate = 0;
    finalIgstAmount = 0;
  }

  // 6. Grand Total = Subtotal + SGST + CGST + IGST
  const grandTotal = round2(
    subtotal + finalSgstAmount + finalCgstAmount + finalIgstAmount
  );

  return {
    items: sanitizedItems,
    grossAmount,
    discountType,
    discountPercent: finalDiscountPercent,
    discountAmount: discountAmt,
    subtotal,
    taxMode,
    sgstRate: finalSgstRate,
    sgstAmount: finalSgstAmount,
    cgstRate: finalCgstRate,
    cgstAmount: finalCgstAmount,
    igstRate: finalIgstRate,
    igstAmount: finalIgstAmount,
    grandTotal
  };
};
