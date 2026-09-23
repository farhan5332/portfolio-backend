import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projects.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
