import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));

// Logged-in admin only
router.get('/me', protect, authController.me);
router.put(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
