import * as authService from '../services/auth.service.js';
import { REFRESH_COOKIE, refreshCookieOptions } from '../utils/tokens.js';

// Refresh token goes in the httpOnly cookie; access token and user go in the JSON body.
const sendAuthResponse = (res, { user, accessToken, refreshToken }) => {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ success: true, data: { user, accessToken } });
};

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

// POST /api/auth/login
export const login = async (req, res) => {
  sendAuthResponse(res, await authService.login(req.body));
};

// POST /api/auth/refresh
export const refresh = async (req, res) => {
  try {
    sendAuthResponse(res, await authService.refresh(req.cookies[REFRESH_COOKIE]));
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
export const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  sendAuthResponse(res, await authService.changePassword(req.user.id, req.body));
};
