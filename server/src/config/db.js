import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from './env.js';

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED errors on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in case environment prohibits custom DNS configuration
}

let isConnected = false;
let listenersAttached = false;

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = config.mongodbUri || 'mongodb://127.0.0.1:27017/kolwa_billing';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    isConnected = true;
    console.log(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    if (!listenersAttached) {
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB connection lost. Reconnecting...');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully.');
        isConnected = true;
      });

      listenersAttached = true;
    }

    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`MongoDB Connection Failed: ${error.message}`);
    console.error('Note: Set MONGODB_URI in server/.env with your MongoDB Atlas connection string.');
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isConnected = false;
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
