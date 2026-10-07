import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

// Safety net for the whole API: max 600 requests per IP every 15 minutes.
// Normal browsing and admin work stay far below this; scrapers and floods do not.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new ApiError(429, 'Too many requests. Please slow down.', { code: 'RATE_LIMITED' })),
});

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

// Stops contact form spam: max 5 messages per IP every hour.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(
      new ApiError(429, 'Too many messages sent. Please try again later.', {
        code: 'RATE_LIMITED',
      })
    ),
});
