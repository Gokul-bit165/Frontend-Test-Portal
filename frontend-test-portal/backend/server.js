/**
 * Backend Server Entry Point
 * Express server with CORS, routes, and middleware setup
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import routes
const challengesRouter = require('./routes/challenges');
const submissionsRouter = require('./routes/submissions');
const evaluationRouter = require('./routes/evaluation');
const adminRouter = require('./routes/admin');
const coursesRouter = require('./routes/courses');
const usersRouter = require('./routes/users');
const levelCompletionRouter = require('./routes/levelCompletion');
const assetsRouter = require('./routes/assets');
const testSessionsRouter = require('./routes/testSessions');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now as it may block inline scripts
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } // Allow OAuth popups
}));

// Compression for better performance
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Apache-style logs
} else {
  app.use(morgan('dev')); // Colored dev logs
}

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/auth/google', authLimiter);
app.use('/api/admin/login', authLimiter);

// CORS Configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:80'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const isLocalhostOrigin = origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://127.0.0.1');

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      isLocalhostOrigin ||
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' })); // Reduced from 50mb for security
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);


// Create necessary directories
const screenshotsDir = path.join(__dirname, 'screenshots');
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Static file serving for screenshots and assets
app.use('/screenshots', express.static(screenshotsDir));
app.use('/assets', express.static(assetsDir));

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const db = require('./database/connection');
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };

  try {
    if (db.isConnected()) {
      await db.query('SELECT 1');
      health.database = 'connected';
    }
  } catch (error) {
    health.database = 'error: ' + error.message;
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/evaluate', evaluationRouter);
app.use('/api/auth', usersRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/level-completion', levelCompletionRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/test-sessions', testSessionsRouter);

// Serve frontend static files
// In Docker, frontend/dist is copied to the same directory as server.js
// In development, it's in ../frontend/dist
const frontendDistPath = fs.existsSync(path.join(__dirname, 'frontend/dist')) 
  ? path.join(__dirname, 'frontend/dist')
  : path.resolve(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  console.log('✅ Serving frontend from:', frontendDistPath);
  app.use(express.static(frontendDistPath));

  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes, screenshots, assets, and health check
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/screenshots') || 
        req.path.startsWith('/assets') || 
        req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.warn('⚠️ Frontend dist folder not found. API will run, but the frontend will not be served.');
  console.warn('   To build the frontend, run `npm install && npm run build` in the `frontend` directory.');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak sensitive error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
    ...(err.code && { code: err.code })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📁 API Endpoints:`);
  console.log(`   GET  /api/challenges`);
  console.log(`   POST /api/submissions`);
  console.log(`   POST /api/evaluate`);
  console.log(`   POST /api/admin/login`);
});

module.exports = app;
