import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './config/uploads.js';
import routes from './routes/index.js';
import { serve as serveUpload } from './controllers/media.controller.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { asyncHandler } from './utils/asyncHandler.js';

// The built admin panel (npm run build). Served at /admin when it exists.
const ADMIN_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'admin', 'dist');
const ADMIN_INDEX = path.join(ADMIN_DIST, 'index.html');

const app = express();

// Render/Railway sit behind a proxy. This makes req.ip (used by the rate limiter)
// and secure cookies work correctly in production.
if (env.isProd) app.set('trust proxy', 1);

// Security headers. cross-origin policy lets the frontend load images from /uploads.
// The content security policy applies to the admin panel served at /admin: scripts only
// from this server, images from anywhere over https (content may link external images).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'frame-src': ["'self'", 'blob:'],
        // Would break http://localhost when running a production build on your own machine
        'upgrade-insecure-requests': env.isProd ? [] : null,
      },
    },
  })
);

// Only the portfolio frontend and admin panel may call this API from a browser.
app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    // Allowed: requests with no origin (curl, Postman, server-to-server), the sites in
    // CLIENT_URLS, and this server itself (the admin panel at /admin).
    const sameOrigin = origin === `${req.protocol}://${req.headers.host}`;
    if (!origin || sameOrigin || env.clientUrls.includes(origin)) {
      return callback(null, { origin: true, credentials: true }); // credentials = refresh-token cookie
    }
    callback(new ApiError(403, `CORS: origin ${origin} is not allowed`));
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Uploaded files are served from /uploads/<filename>.
// Filenames are unique and never reused, so browsers may cache them for a long time.
if (env.uploadStorage === 'database') {
  app.get(`${UPLOAD_URL_PREFIX}/:filename`, asyncHandler(serveUpload));
} else {
  app.use(
    UPLOAD_URL_PREFIX,
    express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' })
  );
}

// All API routes live under /api
app.use('/api', apiLimiter, routes);

// Admin panel: one deployment serves both the API and the CMS, so the login cookie
// stays first-party. Asset files have hashed names (cache forever); every other
// /admin/... URL is a page of the single-page app, so it gets index.html.
if (fs.existsSync(ADMIN_INDEX)) {
  app.use('/admin', express.static(ADMIN_DIST, { index: false, maxAge: '1y', immutable: true }));
  app.get('/admin{/*page}', (req, res, next) => {
    if (path.extname(req.path)) return next(); // a missing asset is a real 404
    res.set('Cache-Control', 'no-cache').sendFile(ADMIN_INDEX);
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
