import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';
import { runSeed } from './scripts/seed.js';

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Running initial idempotent database seeds...');
    await runSeed();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(` Kolwa Embroidery Billing System API Server Running `);
      console.log(` Port: ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` API URL: http://localhost:${config.port}/api`);
      console.log(` Health: http://localhost:${config.port}/api/health`);
      console.log(`====================================================`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await disconnectDB();
          console.log('MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
