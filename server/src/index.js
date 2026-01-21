import express from 'express';
import cors from 'cors';
import session from 'express-session';
import config from './config/index.js';
import passport from './config/passport.js';
import { connectDB, isConnected, getConnectionStatus } from './database/connection.js';

// Routes
import facialAnalysisRoutes from './routes/facialAnalysis.js';
import authRoutes from './routes/auth.js';
import gmailRoutes from './routes/gmail.js';
import tasksRoutes from './routes/tasks.js';

const app = express();
const PORT = config.port;

// CORS configuration: allow credentials for session cookies
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',  // HTTPS only in future production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax'
  }
}));

// Initializing Passport
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    services: {
      google: !!(config.google.clientId && config.google.clientSecret),
      azure: !!(config.azure.faceApiKey && config.azure.faceApiEndpoint),
      mongodb: isConnected()
    },
    database: {
      status: getConnectionStatus(),
      connected: isConnected()
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Empathetic Workspace API',
    version: '1.0.0',
    description: 'Emotion-Aware Adaptive Email and Task Manager Backend',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      gmail: '/api/gmail/*',
      tasks: '/api/tasks/*',
      facialAnalysis: '/api/facial-analysis/*'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/facial-analysis', facialAnalysisRoutes);
app.use('/api/tasks', tasksRoutes);

// Error handlers
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// Starting the server
const startServer = async () => {
  try {
    console.log('\n[Server] Connecting to MongoDB...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Empathetic Workspace Server                              ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                 ║
║   Environment: ${config.nodeEnv.padEnd(12)}                            ║
║                                                               ║
║   Services:                                                   ║
║   • MongoDB:      ${isConnected() ? '✓ Connected' : '✗ Disconnected'}                           ║
║   • Google OAuth: ${config.google.clientId ? '✓ Configured' : '✗ Not configured'}                           ║
║   • Azure Face:   ${config.azure.faceApiKey ? '✓ Configured' : '✗ Not configured'}                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('\n[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

// Handling graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  try {
    const { disconnectDB } = await import('./database/connection.js');
    await disconnectDB();
  } catch (error) {
    console.error('[Server] Error during shutdown:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Received SIGTERM signal...');
  try {
    const { disconnectDB } = await import('./database/connection.js');
    await disconnectDB();
  } catch (error) {
    console.error('[Server] Error during shutdown:', error.message);
  }
  process.exit(0);
});

// Start the server
startServer();

export default app;
