import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware - SIMPLIFIED CORS
app.use(cors()); // Allow all origins for testing

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Basic route
app.get('/', (_req, res) => {
  res.json({
    message: 'User Management API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      docs: 'Coming soon'
    }
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-management-api',
    hostname: os.hostname()
  });
});

// SIMPLE TEST endpoint (no CORS issues)
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    simple: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Server is running!');
  console.log(`📌 Access: http://127.0.0.1:${PORT}`);
  console.log(`📊 Health: http://127.0.0.1:${PORT}/api/health`);
  console.log(`🧪 Test: http://127.0.0.1:${PORT}/api/test`);
  console.log('🌐 Frontend: http://127.0.0.1:4200');
  console.log('='.repeat(50));
});// CI/CD test trigger
