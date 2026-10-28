import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
  address: z.string().optional().default(''),
  gstin: z.string().min(1, 'GSTIN is required').trim().toUpperCase(),
  mobile: z.string().optional().default(''),
  defaultDiscountPercent: z.number().min(0).max(100).optional().default(0),
  notes: z.string().optional().default(''),
  companyIds: z.array(z.string()).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();
