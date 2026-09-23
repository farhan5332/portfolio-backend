import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITHM = 'HS256';

// Access token: short-lived, sent by the admin panel in the Authorization header.
export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, env.jwt.accessSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwt.accessExpiresIn,
  });

// Refresh token: long-lived, stored only in an httpOnly cookie (JavaScript can't read it).
export const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion }, env.jwt.refreshSecret, {
    algorithm: ALGORITHM,
    expiresIn: `${env.jwt.refreshExpiresDays}d`,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret, { algorithms: [ALGORITHM] });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret, { algorithms: [ALGORITHM] });

export const REFRESH_COOKIE = 'refreshToken';

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd, // HTTPS only in production
  // In production the admin panel and API are on different domains, which requires 'none'.
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/api/auth', // the cookie is only sent to auth routes
  maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
});
