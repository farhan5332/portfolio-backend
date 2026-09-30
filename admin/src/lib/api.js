// Tiny fetch wrapper for the CMS API.
// - The access token lives only in memory (safer than localStorage).
// - The refresh token is an httpOnly cookie the browser sends to /api/auth/*.
// - When the API says TOKEN_EXPIRED, we refresh once and retry the request.

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Uploaded files are stored as "/uploads/x.png". In production the API is on another
// domain, so prefix those paths with the API's origin.
const API_ORIGIN = API_URL.startsWith('http') ? new URL(API_URL).origin : '';
export const assetUrl = (url) => (url && url.startsWith('/') ? `${API_ORIGIN}${url}` : url || '');

let accessToken = null;
let refreshPromise = null;
let onSessionExpired = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.code = body?.code;
    this.details = body?.details || [];
  }

  // { title: 'Title is required', 'socials.0.url': '...' }
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

const send = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = {};
  const isForm = body instanceof FormData;

  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { message: 'Cannot reach the server. Is the API running?' });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
};

// Only one refresh at a time, even if 5 requests expire together.
export const refreshSession = () => {
  refreshPromise ??= send('/auth/refresh', { method: 'POST', auth: false })
    .then((res) => {
      setAccessToken(res.data.accessToken);
      return res.data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
};

export const request = async (path, options = {}) => {
  try {
    return await send(path, options);
  } catch (err) {
    const canRetry = options.auth !== false && err.status === 401 && err.code === 'TOKEN_EXPIRED';
    if (!canRetry) {
      if (err.status === 401 && options.auth !== false) onSessionExpired();
      throw err;
    }

    try {
      await refreshSession();
    } catch (refreshErr) {
      onSessionExpired();
      throw refreshErr;
    }
    return send(path, options);
  }
};

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (kind, file, alt = '') => {
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    return request(`/upload/${kind}`, { method: 'POST', body: form });
  },
};

// Build "?a=1&b=2", skipping empty values
export const toQuery = (params) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
};
