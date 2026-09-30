import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request, refreshSession, setAccessToken, setSessionExpiredHandler } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('guest');
  }, []);

  // On page load, the access token is gone (it was only in memory), but the refresh
  // cookie may still be valid. Try to restore the session silently.
  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    refreshSession()
      .then((data) => {
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(clearSession);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await request('/auth/logout', { method: 'POST', auth: false }).catch(() => {});
    clearSession();
  }, [clearSession]);

  // After a password change the API issues fresh tokens for this session.
  const updateSession = useCallback(({ user: nextUser, accessToken }) => {
    if (accessToken) setAccessToken(accessToken);
    if (nextUser) setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, updateSession }),
    [user, status, login, logout, updateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
