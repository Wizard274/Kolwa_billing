import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatInvoiceNumber } from '../src/services/invoiceNumberService.js';

describe('Invoice Numbering Unit Tests', () => {
  test('formatInvoiceNumber formats standard prefix and zero-padded sequence', () => {
    assert.equal(formatInvoiceNumber('KOLWA-', 1), 'KOLWA-001');
    assert.equal(formatInvoiceNumber('KOLWA-', 42), 'KOLWA-042');
    assert.equal(formatInvoiceNumber('KOLWA-', 999), 'KOLWA-999');
    assert.equal(formatInvoiceNumber('KOLWA-', 1000), 'KOLWA-1000');
  });

  test('formatInvoiceNumber handles prefixes without trailing hyphen', () => {
    assert.equal(formatInvoiceNumber('KC', 5), 'KC-005');
    assert.equal(formatInvoiceNumber('SHREE', 12), 'SHREE-012');
  });

  test('formatInvoiceNumber handles lowercase and extra whitespace', () => {
    assert.equal(formatInvoiceNumber('  kolwa  ', 7), 'KOLWA-007');
  });
});
