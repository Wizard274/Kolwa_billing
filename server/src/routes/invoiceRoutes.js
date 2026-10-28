import express from 'express';
import {
  getInvoiceById,
  updateDraftInvoice,
  issueDraftInvoice,
  voidInvoice,
  deleteDraftInvoice
} from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateDraftInvoiceSchema, voidInvoiceSchema } from '../validators/invoiceValidator.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:id', getInvoiceById);
router.patch('/:id', validateBody(updateDraftInvoiceSchema), updateDraftInvoice);
router.post('/:id/issue', issueDraftInvoice);
router.post('/:id/void', validateBody(voidInvoiceSchema), voidInvoice);
router.delete('/:id', deleteDraftInvoice);

export default router;
