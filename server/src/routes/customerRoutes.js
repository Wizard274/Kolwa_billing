import express from 'express';
import {
  getCustomerById,
  updateCustomer,
  archiveCustomer
} from '../controllers/customerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateCustomerSchema } from '../validators/customerValidator.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:id', getCustomerById);
router.patch('/:id', validateBody(updateCustomerSchema), updateCustomer);
router.patch('/:id/archive', archiveCustomer);

export default router;
