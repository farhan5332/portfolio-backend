import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

// Blocks password guessing: max 10 FAILED login attempts per IP every 15 minutes.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(
      new ApiError(429, 'Too many login attempts. Please try again in 15 minutes.', {
        code: 'RATE_LIMITED',
      })
    ),
});
