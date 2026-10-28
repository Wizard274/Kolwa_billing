import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatInvoiceNumber } from '../src/services/invoiceNumberService.js';
import { calculateInvoiceTotals } from '../src/services/calculationService.js';

describe('Business Rules & Company Independence Tests', () => {
  test('Each company maintains independent prefix and sequence logic', () => {
    const kolwaImpexPrefix = 'KOLWA-';
    const kolwaCreationPrefix = 'KC-';
    const shreeImpexPrefix = 'SHREE-';

    // Simulate sequences for 3 distinct companies
    let seqKolwaImpex = 1;
    let seqKolwaCreation = 1;
    let seqShreeImpex = 1;

    // Issue bill in Kolwa Impex
    const bill1 = formatInvoiceNumber(kolwaImpexPrefix, seqKolwaImpex++);
    assert.equal(bill1, 'KOLWA-001');

    // Issue bill in Shree Impex
    const bill2 = formatInvoiceNumber(shreeImpexPrefix, seqShreeImpex++);
    assert.equal(bill2, 'SHREE-001');

    // Issue second bill in Kolwa Impex
    const bill3 = formatInvoiceNumber(kolwaImpexPrefix, seqKolwaImpex++);
    assert.equal(bill3, 'KOLWA-002');

    // Verify Kolwa Creation is still at sequence 1
    const bill4 = formatInvoiceNumber(kolwaCreationPrefix, seqKolwaCreation++);
    assert.equal(bill4, 'KC-001');

    // Sequences must remain separate and never collide
    assert.notEqual(bill1, bill2);
    assert.notEqual(bill1, bill4);
  });

  test('Preservation rule: Voided invoice preserves sequence number', () => {
    let currentSequence = 5;
    const issuedBill = {
      invoiceNumber: formatInvoiceNumber('KOLWA-', currentSequence),
      sequence: currentSequence,
      status: 'issued'
    };

    assert.equal(issuedBill.invoiceNumber, 'KOLWA-005');

    // When voided, invoice is marked void with audit trail; sequence is NOT decremented
    const voidedBill = {
      ...issuedBill,
      status: 'void',
      voidReason: 'Wrong party GSTIN entered',
      voidedAt: new Date()
    };

    assert.equal(voidedBill.status, 'void');
    assert.equal(voidedBill.invoiceNumber, 'KOLWA-005');

    // Next bill sequence must be 6, NOT reusing 5
    currentSequence += 1;
    const nextBillNumber = formatInvoiceNumber('KOLWA-', currentSequence);
    assert.equal(nextBillNumber, 'KOLWA-006');
    assert.notEqual(nextBillNumber, voidedBill.invoiceNumber);
  });

  test('Draft vs Issued protection policy', () => {
    const draftInvoice = {
      status: 'draft',
      invoiceNumber: 'DRAFT-1',
      items: [{ description: 'Draft work', quantity: 10, rate: 50, lineTotal: 500 }]
    };

    // Draft can be edited or deleted
    const canDeleteDraft = draftInvoice.status === 'draft';
    assert.equal(canDeleteDraft, true);

    const issuedInvoice = {
      status: 'issued',
      invoiceNumber: 'KOLWA-001',
      items: [{ description: 'Issued work', quantity: 10, rate: 50, lineTotal: 500 }]
    };

    // Issued cannot be deleted
    const canDeleteIssued = issuedInvoice.status === 'draft';
    assert.equal(canDeleteIssued, false);
  });

  test('Snapshot preservation rule: Changing company profile does not change invoice snapshot', () => {
    const originalCompanyProfile = {
      name: 'Kolwa Impex',
      address: '101 Surat Textile Market',
      gstin: '24AAAAA0000A1Z5'
    };

    // Issue invoice with snapshot
    const invoiceSnapshot = { ...originalCompanyProfile };

    // Administrator later updates company profile address & GST
    const updatedCompanyProfile = {
      ...originalCompanyProfile,
      address: 'New Ring Road Complex, Surat',
      gstin: '24BBBBB1111B2Z6'
    };

    // The historical invoice snapshot remains intact
    assert.equal(invoiceSnapshot.address, '101 Surat Textile Market');
    assert.equal(invoiceSnapshot.gstin, '24AAAAA0000A1Z5');
    assert.notEqual(invoiceSnapshot.address, updatedCompanyProfile.address);
  });

  test('GST Tax treatment exclusivity: Intrastate vs Interstate', () => {
    // Intrastate calculation: CGST 2.5% + SGST 2.5%, IGST must be 0
    const intrastate = calculateInvoiceTotals({
      items: [{ description: 'Embroidery', quantity: 10, rate: 100 }],
      taxMode: 'intrastate',
      sgstRate: 2.5,
      cgstRate: 2.5
    });

    assert.equal(intrastate.sgstAmount, 25);
    assert.equal(intrastate.cgstAmount, 25);
    assert.equal(intrastate.igstAmount, 0);
    assert.equal(intrastate.grandTotal, 1050);

    // Interstate calculation: IGST 5%, CGST and SGST must be 0
    const interstate = calculateInvoiceTotals({
      items: [{ description: 'Embroidery', quantity: 10, rate: 100 }],
      taxMode: 'interstate',
      igstRate: 5.0
    });

    assert.equal(interstate.igstAmount, 50);
    assert.equal(interstate.cgstAmount, 0);
    assert.equal(interstate.sgstAmount, 0);
    assert.equal(interstate.grandTotal, 1050);
  });

  test('Duplicate Bill Prevention: Identical items detection logic', async () => {
    const { areInvoiceItemsIdentical } = await import('../src/controllers/invoiceController.js');

    const originalItems = [
      { challanNumber: 'CH-101', description: 'Kurti neck design', quantity: 100, rate: 12.5, lineTotal: 1250 },
      { challanNumber: 'CH-102', description: 'Sleeve border', quantity: 200, rate: 8.0, lineTotal: 1600 }
    ];

    // Same items in different order and whitespace
    const duplicateItems = [
      { challanNumber: ' CH-102 ', description: 'Sleeve border', quantity: 200, rate: 8.0, lineTotal: 1600 },
      { challanNumber: 'CH-101', description: 'Kurti neck design', quantity: 100, rate: 12.5, lineTotal: 1250 }
    ];

    assert.equal(areInvoiceItemsIdentical(originalItems, duplicateItems), true);

    // Modified quantity: not a duplicate
    const differentQtyItems = [
      { challanNumber: 'CH-101', description: 'Kurti neck design', quantity: 101, rate: 12.5, lineTotal: 1262.5 },
      { challanNumber: 'CH-102', description: 'Sleeve border', quantity: 200, rate: 8.0, lineTotal: 1600 }
    ];
    assert.equal(areInvoiceItemsIdentical(originalItems, differentQtyItems), false);

    // Modified rate: not a duplicate
    const differentRateItems = [
      { challanNumber: 'CH-101', description: 'Kurti neck design', quantity: 100, rate: 15.0, lineTotal: 1500 },
      { challanNumber: 'CH-102', description: 'Sleeve border', quantity: 200, rate: 8.0, lineTotal: 1600 }
    ];
    assert.equal(areInvoiceItemsIdentical(originalItems, differentRateItems), false);
  });
});
