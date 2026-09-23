import mongoose from 'mongoose';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const getHealth = (req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] ?? 'unknown';
  const healthy = db === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    db,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
