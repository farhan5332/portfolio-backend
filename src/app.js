import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './config/uploads.js';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// Render/Railway sit behind a proxy. This makes req.ip (used by the rate limiter)
// and secure cookies work correctly in production.
if (env.isProd) app.set('trust proxy', 1);

// Security headers. cross-origin policy lets the frontend load images from /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the portfolio frontend and admin panel may call this API from a browser.
app.use(
  cors({
    origin(origin, callback) {
      // Requests with no origin (curl, Postman, server-to-server) are allowed.
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      callback(new ApiError(403, `CORS: origin ${origin} is not allowed`));
    },
    credentials: true, // needed later for the refresh-token cookie
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Uploaded files are served from /uploads/<filename>.
// Filenames are unique and never reused, so browsers may cache them for a long time.
app.use(
  UPLOAD_URL_PREFIX,
  express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' })
);

// All API routes live under /api
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
