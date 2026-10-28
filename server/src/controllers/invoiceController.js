import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Company } from '../models/Company.js';
import { Customer } from '../models/Customer.js';
import { calculateInvoiceTotals } from '../services/calculationService.js';
import { generateNextInvoiceNumber, previewNextInvoiceNumber } from '../services/invoiceNumberService.js';

export const areInvoiceItemsIdentical = (items1, items2) => {
  if (!Array.isArray(items1) || !Array.isArray(items2)) return false;
  if (items1.length !== items2.length) return false;

  const normalizeItem = (item) => ({
    challan: (item.challanNumber || '').trim().toLowerCase(),
    desc: (item.description || '').trim().toLowerCase(),
    qty: Number(item.quantity) || 0,
    rate: Number(item.rate) || 0,
    total: Number(item.lineTotal) || 0
  });

  const list1 = items1.map(normalizeItem).sort((a, b) =>
    a.challan.localeCompare(b.challan) || a.desc.localeCompare(b.desc) || a.qty - b.qty || a.rate - b.rate
  );
  const list2 = items2.map(normalizeItem).sort((a, b) =>
    a.challan.localeCompare(b.challan) || a.desc.localeCompare(b.desc) || a.qty - b.qty || a.rate - b.rate
  );

  return list1.every((it1, idx) => {
    const it2 = list2[idx];
    return (
      it1.challan === it2.challan &&
      it1.desc === it2.desc &&
      it1.qty === it2.qty &&
      it1.rate === it2.rate &&
      it1.total === it2.total
    );
  });
};

export const getNextBillNumber = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const nextNumber = await previewNextInvoiceNumber(companyId);
    res.json({
      success: true,
      nextInvoiceNumber: nextNumber
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const {
      customerId,
      invoiceDate,
      invoiceNumber: customInvoiceNumber,
      status = 'issued',
      items,
      discountType = 'percentage',
      discountPercent = 0,
      manualDiscountAmount = 0,
      taxMode = 'intrastate',
      sgstRate = 2.5,
      cgstRate = 2.5,
      igstRate = 0,
      notes = '',
      customerSnapshot: customCustomerSnapshot
    } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Authoritative recalculation of all financial lines and taxes
    const calc = calculateInvoiceTotals({
      items,
      discountType,
      discountPercent,
      manualDiscountAmount,
      taxMode,
      sgstRate,
      cgstRate,
      igstRate
    });

    // Deduplication Check: If all details of the bill are identical, don't save twice
    const targetDate = invoiceDate ? new Date(invoiceDate) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const potentialDuplicates = await Invoice.find({
      companyId,
      customerId,
      status: { $in: ['issued', 'draft'] },
      taxMode: calc.taxMode,
      grandTotal: calc.grandTotal,
      invoiceDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const duplicateInvoice = potentialDuplicates.find((existing) => {
      if (Number(existing.subtotal) !== Number(calc.subtotal)) return false;
      if (Number(existing.discountAmount) !== Number(calc.discountAmount)) return false;
      if (Number(existing.grossAmount) !== Number(calc.grossAmount)) return false;
      return areInvoiceItemsIdentical(existing.items, calc.items);
    });

    if (duplicateInvoice) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `A bill with the exact same details has already been saved (${duplicateInvoice.invoiceNumber}). Duplicate bills cannot be saved twice.`,
        invoice: duplicateInvoice
      });
    }

    // Extract unique challan numbers from items
    const challanNumbers = [
      ...new Set(
        calc.items
          .map((i) => i.challanNumber)
          .filter((ch) => ch && ch.trim().length > 0)
      )
    ];

    // Company Snapshot at issuance
    const companySnapshot = {
      name: company.name,
      address: company.address || '',
      mobile: company.mobile || '',
      gstin: company.gstin || '',
      invoicePrefix: company.invoicePrefix
    };

    // Customer Snapshot with optional bill-specific overrides
    const customerSnapshot = {
      name: customCustomerSnapshot?.name || customer.name,
      address: customCustomerSnapshot?.address ?? customer.address ?? '',
      gstin: customCustomerSnapshot?.gstin ?? customer.gstin ?? '',
      mobile: customCustomerSnapshot?.mobile ?? customer.mobile ?? ''
    };

    let invoiceNumber;
    let invoiceSequence;

    if (customInvoiceNumber && customInvoiceNumber.trim().length > 0) {
      const trimmedCustom = customInvoiceNumber.trim();
      const existing = await Invoice.findOne({ companyId, invoiceNumber: trimmedCustom });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Bill number "${trimmedCustom}" already exists for this company. Please enter a unique bill number.`
        });
      }
      invoiceNumber = trimmedCustom;
      const match = trimmedCustom.match(/(\d+)$/);
      invoiceSequence = match ? parseInt(match[1], 10) : 0;
      if (invoiceSequence > (company.currentInvoiceSequence || 0)) {
        company.currentInvoiceSequence = invoiceSequence;
        await company.save();
      }
    } else if (status === 'draft') {
      const draftCount = await Invoice.countDocuments({ companyId, status: 'draft' });
      invoiceNumber = `DRAFT-${draftCount + 1}`;
      invoiceSequence = 0;
    } else {
      // Atomic increment per company
      const nextNum = await generateNextInvoiceNumber(companyId);
      invoiceNumber = nextNum.invoiceNumber;
      invoiceSequence = nextNum.sequence;
    }

    const invoice = await Invoice.create({
      companyId,
      customerId,
      invoiceNumber,
      invoiceSequence,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      status,
      challanNumbers,
      companySnapshot,
      customerSnapshot,
      items: calc.items,
      grossAmount: calc.grossAmount,
      discountType: calc.discountType,
      discountPercent: calc.discountPercent,
      discountAmount: calc.discountAmount,
      subtotal: calc.subtotal,
      taxMode: calc.taxMode,
      sgstRate: calc.sgstRate,
      sgstAmount: calc.sgstAmount,
      cgstRate: calc.cgstRate,
      cgstAmount: calc.cgstAmount,
      igstRate: calc.igstRate,
      igstAmount: calc.igstAmount,
      grandTotal: calc.grandTotal,
      notes: (notes || '').trim(),
      createdBy: req.user?._id,
      issuedAt: status === 'issued' ? new Date() : null
    });

    res.status(201).json({
      success: true,
      message: status === 'issued' ? 'Bill saved and issued successfully' : 'Draft bill saved successfully',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyInvoices = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const {
      month,
      year,
      startDate,
      endDate,
      customer,
      invoiceNumber,
      challanNumber,
      status,
      search,
      page = 1,
      limit = 50,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    const query = { companyId: new mongoose.Types.ObjectId(companyId) };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Customer filter
    if (customer) {
      query.customerId = customer;
    }

    // Specific invoice number search
    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber.trim(), $options: 'i' };
    }

    // Challan number search
    if (challanNumber) {
      query.challanNumbers = { $regex: challanNumber.trim(), $options: 'i' };
    }

    // Date filtering: Month & Year or explicit Range
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    } else if (month !== undefined && month !== '' && year !== undefined && year !== '') {
      const m = parseInt(month, 10); // 1-12
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      query.invoiceDate = { $gte: start, $lte: end };
    }

    // Generic search across customer name, invoice number, or challans
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { invoiceNumber: { $regex: s, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: s, $options: 'i' } },
        { challanNumbers: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    if (sortBy !== '_id') sortObj._id = -1;

    const [invoices, totalCount, summaryAgg] = await Promise.all([
      Invoice.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('customerId', 'name mobile gstin')
        .populate('companyId', 'name mobile gstin address invoicePrefix'),
      Invoice.countDocuments(query),
      Invoice.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSubtotal: { $sum: '$subtotal' },
            totalTax: {
              $sum: { $add: ['$sgstAmount', '$cgstAmount', '$igstAmount'] }
            },
            totalGrandTotal: { $sum: '$grandTotal' }
          }
        }
      ])
    ]);

    const summary = summaryAgg[0] || {
      totalSubtotal: 0,
      totalTax: 0,
      totalGrandTotal: 0
    };

    res.json({
      success: true,
      invoices,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      summary
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('companyId', 'name address mobile gstin invoicePrefix')
      .populate('customerId', 'name address mobile gstin');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateDraftInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Safety check: only drafts can be directly edited
    if (invoice.status !== 'draft') {
      return res.status(403).json({
        success: false,
        message: 'Issued invoices cannot be directly modified to preserve financial audit trail. Void the invoice if a cancellation is needed.'
      });
    }

    const {
      customerId,
      invoiceDate,
      items,
      discountType,
      discountPercent,
      manualDiscountAmount,
      taxMode,
      sgstRate,
      cgstRate,
      igstRate,
      notes,
      customerSnapshot
    } = req.body;

    if (items) {
      const calc = calculateInvoiceTotals({
        items,
        discountType: discountType || invoice.discountType,
        discountPercent: discountPercent !== undefined ? discountPercent : invoice.discountPercent,
        manualDiscountAmount: manualDiscountAmount !== undefined ? manualDiscountAmount : invoice.discountAmount,
        taxMode: taxMode || invoice.taxMode,
        sgstRate: sgstRate !== undefined ? sgstRate : invoice.sgstRate,
        cgstRate: cgstRate !== undefined ? cgstRate : invoice.cgstRate,
        igstRate: igstRate !== undefined ? igstRate : invoice.igstRate
      });

      invoice.items = calc.items;
      invoice.grossAmount = calc.grossAmount;
      invoice.discountType = calc.discountType;
      invoice.discountPercent = calc.discountPercent;
      invoice.discountAmount = calc.discountAmount;
      invoice.subtotal = calc.subtotal;
      invoice.taxMode = calc.taxMode;
      invoice.sgstRate = calc.sgstRate;
      invoice.sgstAmount = calc.sgstAmount;
      invoice.cgstRate = calc.cgstRate;
      invoice.cgstAmount = calc.cgstAmount;
      invoice.igstRate = calc.igstRate;
      invoice.igstAmount = calc.igstAmount;
      invoice.grandTotal = calc.grandTotal;

      invoice.challanNumbers = [
        ...new Set(
          calc.items
            .map((i) => i.challanNumber)
            .filter((ch) => ch && ch.trim().length > 0)
        )
      ];
    }

    if (customerId) invoice.customerId = customerId;
    if (invoiceDate) invoice.invoiceDate = new Date(invoiceDate);
    if (notes !== undefined) invoice.notes = notes.trim();
    if (customerSnapshot) {
      invoice.customerSnapshot = {
        ...invoice.customerSnapshot,
        ...customerSnapshot
      };
    }

    invoice.updatedBy = req.user?._id;
    invoice.version += 1;
    await invoice.save();

    res.json({
      success: true,
      message: 'Draft invoice updated successfully',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const issueDraftInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Invoice is already in "${invoice.status}" status`
      });
    }

    // Generate authoritative sequential invoice number
    const nextNum = await generateNextInvoiceNumber(invoice.companyId);

    invoice.invoiceNumber = nextNum.invoiceNumber;
    invoice.invoiceSequence = nextNum.sequence;
    invoice.status = 'issued';
    invoice.issuedAt = new Date();
    invoice.updatedBy = req.user?._id;
    invoice.version += 1;

    await invoice.save();

    res.json({
      success: true,
      message: `Invoice successfully issued as ${invoice.invoiceNumber}`,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const voidInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'void') {
      return res.status(400).json({
        success: false,
        message: 'This invoice has already been cancelled/voided'
      });
    }

    // Preservation rule: Keep invoice number in sequence, do NOT delete, mark as void with audit reason
    invoice.status = 'void';
    invoice.voidedAt = new Date();
    invoice.voidReason = (reason || 'Cancelled by administrator').trim();
    invoice.updatedBy = req.user?._id;
    invoice.version += 1;

    await invoice.save();

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been safely voided with audit record`,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDraftInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Strict safety protection: Only draft invoices can be deleted!
    if (invoice.status !== 'draft') {
      return res.status(403).json({
        success: false,
        message: 'Issued invoices cannot be deleted. Use the void action to cancel an issued invoice while preserving the sequential audit trail.'
      });
    }

    await Invoice.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Draft bill deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
