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

// Import routes
const challengesRouter = require('./routes/challenges');
const submissionsRouter = require('./routes/submissions');
const evaluationRouter = require('./routes/evaluation');
const adminRouter = require('./routes/admin');
const coursesRouter = require('./routes/courses');
const usersRouter = require('./routes/users');
const levelCompletionRouter = require('./routes/levelCompletion');
const assetsRouter = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/auth', usersRouter);


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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
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

// Serve frontend static files in production
const frontendDistPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log('✅ Serving frontend from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  
  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/screenshots') || req.path.startsWith('/assets') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log('⚠️  Frontend dist folder not found at:', frontendDistPath);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for API routes only
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
