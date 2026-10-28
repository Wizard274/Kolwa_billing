import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').trim(),
  address: z.string().optional().default(''),
  mobile: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  defaultDiscountPercent: z.number().min(0).max(100).optional().default(0),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required').trim().toUpperCase(),
  nextInvoiceSequence: z.number().int().min(1).optional().default(1),
  taxSettings: z.object({
    defaultTaxMode: z.enum(['intrastate', 'interstate']).default('intrastate'),
    defaultSgstRate: z.number().min(0).default(2.5),
    defaultCgstRate: z.number().min(0).default(2.5),
    defaultIgstRate: z.number().min(0).default(0)
  }).optional()
});

export const updateCompanySchema = createCompanySchema.partial();
