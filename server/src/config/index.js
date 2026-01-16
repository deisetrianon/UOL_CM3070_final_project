import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server root directory
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Debug: Log if Azure keys are loaded (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('[Config] Azure Face API Key loaded:', process.env.AZURE_FACE_API_KEY ? '✓ Yes' : '✗ No');
  console.log('[Config] Azure Face API Endpoint loaded:', process.env.AZURE_FACE_API_ENDPOINT ? '✓ Yes' : '✗ No');
}

const config = {
  // Server
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Client
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/empathetic-workspace',
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  
  // Azure Face API
  azure: {
    faceApiKey: process.env.AZURE_FACE_API_KEY,
    faceApiEndpoint: process.env.AZURE_FACE_API_ENDPOINT
  }
};

export default config;
