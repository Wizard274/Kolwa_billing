import express from 'express';
import authRoutes from './authRoutes.js';
import companyRoutes from './companyRoutes.js';
import customerRoutes from './customerRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kolwa Embroidery Billing System API',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
