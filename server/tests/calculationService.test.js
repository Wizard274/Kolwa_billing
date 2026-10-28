import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  round2,
  calculateLineTotal,
  calculateInvoiceTotals
} from '../src/services/calculationService.js';

describe('Calculation Service Unit Tests', () => {
  test('round2 handles floating point rounding accurately', () => {
    assert.equal(round2(100.004), 100);
    assert.equal(round2(100.005), 100.01);
    assert.equal(round2(22.5), 22.5);
    assert.equal(round2(0), 0);
  });

  test('calculateLineTotal calculates quantity * rate correctly', () => {
    assert.equal(calculateLineTotal(100, 10), 1000);
    assert.equal(calculateLineTotal(12.5, 40), 500);
    assert.equal(calculateLineTotal(0, 100), 0);
  });

  test('calculateLineTotal throws on negative values', () => {
    assert.throws(() => calculateLineTotal(-5, 10), /Quantity must be a non-negative number/);
    assert.throws(() => calculateLineTotal(10, -5), /Rate must be a non-negative number/);
  });

  test('Specification Example 1: 100 qty @ ₹10, 0% discount, CGST 2.5%, SGST 2.5%', () => {
    const result = calculateInvoiceTotals({
      items: [
        { challanNumber: 'CH-101', description: 'Kurti Zari Work', quantity: 100, rate: 10 }
      ],
      discountType: 'percentage',
      discountPercent: 0,
      taxMode: 'intrastate',
      sgstRate: 2.5,
      cgstRate: 2.5,
      igstRate: 0
    });

    assert.equal(result.grossAmount, 1000);
    assert.equal(result.discountPercent, 0);
    assert.equal(result.discountAmount, 0);
    assert.equal(result.subtotal, 1000);
    assert.equal(result.sgstRate, 2.5);
    assert.equal(result.sgstAmount, 25);
    assert.equal(result.cgstRate, 2.5);
    assert.equal(result.cgstAmount, 25);
    assert.equal(result.igstAmount, 0);
    assert.equal(result.grandTotal, 1050);
  });

  test('Specification Example 2: Gross ₹1,000, 10% discount, Subtotal ₹900, CGST 2.5%, SGST 2.5%', () => {
    const result = calculateInvoiceTotals({
      items: [
        { challanNumber: 'CH-201', description: 'Dupatta Border', quantity: 50, rate: 20 }
      ],
      discountType: 'percentage',
      discountPercent: 10,
      taxMode: 'intrastate',
      sgstRate: 2.5,
      cgstRate: 2.5,
      igstRate: 0
    });

    assert.equal(result.grossAmount, 1000);
    assert.equal(result.discountPercent, 10);
    assert.equal(result.discountAmount, 100);
    assert.equal(result.subtotal, 900);
    assert.equal(result.sgstRate, 2.5);
    assert.equal(result.sgstAmount, 22.5);
    assert.equal(result.cgstRate, 2.5);
    assert.equal(result.cgstAmount, 22.5);
    assert.equal(result.igstAmount, 0);
    assert.equal(result.grandTotal, 945);
  });

  test('Interstate Tax Mode (IGST exclusive: CGST & SGST must be 0)', () => {
    const result = calculateInvoiceTotals({
      items: [
        { challanNumber: 'CH-301', description: 'Lehenga Embroidery', quantity: 10, rate: 200 }
      ],
      discountType: 'percentage',
      discountPercent: 5,
      taxMode: 'interstate',
      igstRate: 5.0
    });

    // Gross = 2000, discount 5% = 100, subtotal = 1900, IGST 5% = 95, grandTotal = 1995
    assert.equal(result.grossAmount, 2000);
    assert.equal(result.discountAmount, 100);
    assert.equal(result.subtotal, 1900);
    assert.equal(result.igstRate, 5);
    assert.equal(result.igstAmount, 95);
    assert.equal(result.cgstAmount, 0);
    assert.equal(result.sgstAmount, 0);
    assert.equal(result.grandTotal, 1995);
  });

  test('Multiple line items sum properly into gross amount', () => {
    const result = calculateInvoiceTotals({
      items: [
        { challanNumber: 'CH-1', description: 'Item 1', quantity: 10, rate: 10 }, // 100
        { challanNumber: 'CH-2', description: 'Item 2', quantity: 20, rate: 15 }, // 300
        { challanNumber: 'CH-1', description: 'Item 3 (repeat challan)', quantity: 5, rate: 20 } // 100
      ],
      discountType: 'percentage',
      discountPercent: 0,
      taxMode: 'intrastate',
      sgstRate: 2.5,
      cgstRate: 2.5
    });

    assert.equal(result.grossAmount, 500);
    assert.equal(result.subtotal, 500);
    assert.equal(result.sgstAmount, 12.5);
    assert.equal(result.cgstAmount, 12.5);
    assert.equal(result.grandTotal, 525);
  });

  test('Manual discount amount works properly and does not exceed gross', () => {
    const result = calculateInvoiceTotals({
      items: [{ description: 'Test', quantity: 10, rate: 100 }],
      discountType: 'manual',
      manualDiscountAmount: 150
    });

    assert.equal(result.grossAmount, 1000);
    assert.equal(result.discountAmount, 150);
    assert.equal(result.subtotal, 850);
  });

  test('Rejects invalid input such as empty items array or negative values', () => {
    assert.throws(
      () => calculateInvoiceTotals({ items: [] }),
      /Invoice must have at least one line item/
    );

    assert.throws(
      () => calculateInvoiceTotals({ items: [{ description: 'X', quantity: -1, rate: 10 }] }),
      /Quantity must be a non-negative number/
    );

    assert.throws(
      () => calculateInvoiceTotals({ items: [{ description: 'X', quantity: 1, rate: -5 }] }),
      /Rate must be a non-negative number/
    );

    assert.throws(
      () => calculateInvoiceTotals({
        items: [{ description: 'X', quantity: 1, rate: 10 }],
        discountPercent: 120
      }),
      /Discount percentage must be between 0 and 100/
    );
  });
});
