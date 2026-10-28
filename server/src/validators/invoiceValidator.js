import { z } from 'zod';

const invoiceItemSchema = z.object({
  challanNumber: z.string().optional().default(''),
  description: z.string().min(1, 'Item description is required').trim(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate cannot be negative')
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  invoiceDate: z.string().or(z.date()).optional(),
  status: z.enum(['draft', 'issued']).optional().default('issued'),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  discountType: z.enum(['percentage', 'manual']).optional().default('percentage'),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  manualDiscountAmount: z.number().min(0).optional().default(0),
  taxMode: z.enum(['intrastate', 'interstate']).optional().default('intrastate'),
  sgstRate: z.number().min(0).optional().default(2.5),
  cgstRate: z.number().min(0).optional().default(2.5),
  igstRate: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(''),
  customerSnapshot: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    gstin: z.string().optional(),
    mobile: z.string().optional()
  }).optional()
});

export const updateDraftInvoiceSchema = createInvoiceSchema.partial();

export const voidInvoiceSchema = z.object({
  reason: z.string().min(1, 'A reason is required to void this invoice').trim()
});
