import express from 'express';
import { login, logout, getMe, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { loginSchema, changePasswordSchema } from '../validators/authValidator.js';

const router = express.Router();

router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);

export default router;
