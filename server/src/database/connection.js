/**
 * MongoDB database connection module.
 * Manages database connection, reconnection logic, and connection status.
 * Provides connection utilities with retry mechanism.
 * 
 * @module database/connection
 */

import mongoose from 'mongoose';
import config from '../config/index.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/**
 * Connects to MongoDB database with retry logic.
 * 
 * @returns {Promise<mongoose.Connection>} MongoDB connection object
 * @throws {Error} If connection fails after max retries
 */
export const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
      
      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected from database');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Reconnected to database');
      });

      return conn;
    } catch (error) {
      retries++;
      console.error(`[MongoDB] Connection attempt ${retries}/${MAX_RETRIES} failed:`, error.message);
      
      if (retries === MAX_RETRIES) {
        console.error('[MongoDB] Max retries reached. Could not connect to database.');
        throw error;
      }
      
      console.log(`[MongoDB] Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

/**
 * Disconnects from MongoDB database.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If disconnection fails
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected successfully');
  } catch (error) {
    console.error('[MongoDB] Error disconnecting:', error.message);
    throw error;
  }
};

/**
 * Checks if the database is currently connected.
 * 
 * @returns {boolean} True if connected, false otherwise
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Gets the current database connection status as a string.
 * 
 * @returns {string} Connection status ('disconnected', 'connected', 'connecting', 'disconnecting', or 'unknown')
 */
export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

export default {
  connectDB,
  disconnectDB,
  isConnected,
  getConnectionStatus
};
