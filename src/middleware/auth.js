import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Put this in front of any route that only logged-in admins may use.
// Usage: router.post('/', protect, createProject)
export const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Not authenticated', { code: 'NO_TOKEN' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // The admin panel sees this code and calls /auth/refresh automatically.
      throw new ApiError(401, 'Access token expired', { code: 'TOKEN_EXPIRED' });
    }
    throw new ApiError(401, 'Invalid access token', { code: 'INVALID_TOKEN' });
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Session is no longer valid. Please log in again.', {
      code: 'SESSION_INVALID',
    });
  }

  req.user = user;
  next();
});

// Restrict a route to certain roles. Always use after protect.
// Usage: router.delete('/:id', protect, authorize('admin'), deleteProject)
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do this'));
    }
    next();
  };
// For public routes: visitors pass through, but if a token IS sent it must be valid.
// This lets the admin panel see drafts while the public site sees only published items.
export const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return protect(req, res, next);
};
