/**
 * Application configuration module.
 * Loads environment variables from .env file and provides centralized configuration.
 * Manages database, Google OAuth, Azure Face API, and server settings.
 * 
 * @module config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('[Config] Error loading .env file:', result.error.message);
  } else {
    console.log('[Config] Loaded .env from:', envPath);
  }
} else {
  console.warn('[Config] .env file not found at:', envPath);
  console.warn('[Config] Please create a .env file with your configuration');
}

console.log('[Config] MongoDB URI loaded:', process.env.MONGODB_URI ? '✓ Yes' : '✗ No');
console.log('[Config] Google Client ID loaded:', process.env.GOOGLE_CLIENT_ID ? '✓ Yes' : '✗ No');
console.log('[Config] Azure Face API Key loaded:', process.env.AZURE_FACE_API_KEY ? '✓ Yes' : '✗ No');

const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zenflow',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  azure: {
    faceApiKey: process.env.AZURE_FACE_API_KEY,
    faceApiEndpoint: process.env.AZURE_FACE_API_ENDPOINT
  }
};

export default config;
