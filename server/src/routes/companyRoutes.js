import express from 'express';
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  archiveCompany,
  getCompanyInvoiceSummary
} from '../controllers/companyController.js';
import {
  getCompanyCustomers,
  createCompanyCustomer
} from '../controllers/customerController.js';
import {
  getCompanyInvoices,
  createInvoice,
  getNextBillNumber
} from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createCompanySchema, updateCompanySchema } from '../validators/companyValidator.js';
import { createCustomerSchema } from '../validators/customerValidator.js';
import { createInvoiceSchema } from '../validators/invoiceValidator.js';

const router = express.Router();

router.use(requireAuth);

// Company routes
router.get('/', getCompanies);
router.post('/', validateBody(createCompanySchema), createCompany);
router.get('/:id', getCompanyById);
router.patch('/:id', validateBody(updateCompanySchema), updateCompany);
router.patch('/:id/archive', archiveCompany);
router.get('/:id/invoice-summary', getCompanyInvoiceSummary);

// Company customer routes
router.get('/:companyId/customers', getCompanyCustomers);
router.post('/:companyId/customers', validateBody(createCustomerSchema), createCompanyCustomer);

// Company invoice routes
router.get('/:companyId/next-number', getNextBillNumber);
router.get('/:companyId/invoices', getCompanyInvoices);
router.post('/:companyId/invoices', validateBody(createInvoiceSchema), createInvoice);

export default router;
