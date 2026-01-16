import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import facialAnalysisRoutes from './routes/facialAnalysis.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
// Increase limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Empathetic Workspace API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Empathetic Workspace API',
    version: '1.0.0',
    description: 'Emotion-Aware Adaptive Email and Task Manager Backend'
  });
});

app.use('/api/facial-analysis', facialAnalysisRoutes);

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
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧘 Empathetic Workspace Server                          ║
║                                                           ║
║   Server running on: http://localhost:${PORT}             ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
