import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled promise rejection:', err);
  process.exit(1);
});

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`🚀 API running at http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
