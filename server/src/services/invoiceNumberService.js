import { Counter } from '../models/Counter.js';
import { Company } from '../models/Company.js';

/**
 * Formats prefix and sequence into standard invoice number (e.g., KOLWA-001)
 */
export const formatInvoiceNumber = (prefix, sequence) => {
  const cleanPrefix = (prefix || 'INV-').trim().toUpperCase();
  const normalizedPrefix = cleanPrefix.endsWith('-') ? cleanPrefix : `${cleanPrefix}-`;
  const paddedSeq = String(sequence).padStart(3, '0');
  return `${normalizedPrefix}${paddedSeq}`;
};

/**
 * Atomically reserves and increments the next invoice number for a given company.
 * Thread-safe and concurrency-safe via atomic findOneAndUpdate.
 * 
 * @param {string} companyId - ObjectId of the company
 * @returns {Promise<{ invoiceNumber: string, sequence: number }>}
 */
export const generateNextInvoiceNumber = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found for invoice number generation');
  }

  const prefix = company.invoicePrefix || 'INV-';

  // Atomic increment or initialization
  let counter = await Counter.findOne({ companyId });

  if (!counter) {
    // Initialize counter starting at company.nextInvoiceSequence
    const startingSequence = Math.max(1, company.nextInvoiceSequence || 1);
    counter = await Counter.create({
      companyId,
      prefix,
      lastSequence: startingSequence
    });
    return {
      invoiceNumber: formatInvoiceNumber(prefix, startingSequence),
      sequence: startingSequence
    };
  }

  // Atomically increment counter
  const updatedCounter = await Counter.findOneAndUpdate(
    { companyId },
    { $inc: { lastSequence: 1 }, $set: { prefix } },
    { new: true }
  );

  return {
    invoiceNumber: formatInvoiceNumber(updatedCounter.prefix, updatedCounter.lastSequence),
    sequence: updatedCounter.lastSequence
  };
};

/**
 * Previews the next invoice number without incrementing the counter.
 * 
 * @param {string} companyId
 * @returns {Promise<string>}
 */
export const previewNextInvoiceNumber = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  const prefix = company.invoicePrefix || 'INV-';
  const counter = await Counter.findOne({ companyId });

  const nextSeq = counter ? counter.lastSequence + 1 : (company.nextInvoiceSequence || 1);
  return formatInvoiceNumber(prefix, nextSeq);
};
