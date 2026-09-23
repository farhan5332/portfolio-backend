import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

// Compared against when the email doesn't exist, so a wrong email takes as long as a
// wrong password. Otherwise attackers could discover valid emails by timing responses.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-protection', 12);

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  // Same message for both cases: never reveal whether the email exists.
  if (!user || !passwordOk) {
    throw new ApiError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { user, ...issueTokens(user) };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token. Please log in.', { code: 'NO_REFRESH_TOKEN' });
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Session expired. Please log in again.', { code: 'REFRESH_INVALID' });
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Session is no longer valid. Please log in again.', {
      code: 'SESSION_INVALID',
    });
  }

  return { user, ...issueTokens(user) };
};

// Bumping tokenVersion kills every existing session for this user (all devices).
// For a personal CMS with one or two admins, that's the safest behaviour.
export const logout = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const { sub, tv } = verifyRefreshToken(refreshToken);
    await User.updateOne({ _id: sub, tokenVersion: tv }, { $inc: { tokenVersion: 1 } });
  } catch {
    // Token already invalid or expired: nothing to revoke.
  }
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect', {
      details: [{ field: 'currentPassword', message: 'Current password is incorrect' }],
    });
  }

  user.password = newPassword; // hashed by the pre('save') hook
  user.tokenVersion += 1; // log out every other session
  await user.save();

  // Issue fresh tokens so the current session stays logged in.
  return { user, ...issueTokens(user) };
};
