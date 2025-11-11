/**
 * Assets Routes
 * Handles file upload and management for admin
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '../assets');
const imagesDir = path.join(assetsDir, 'images');
const referencesDir = path.join(assetsDir, 'references');
const coursesDir = path.join(assetsDir, 'courses');

[assetsDir, imagesDir, referencesDir, coursesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Asset metadata storage
const metadataPath = path.join(__dirname, '../data/assets-metadata.json');

// Initialize metadata file if it doesn't exist
if (!fs.existsSync(metadataPath)) {
  fs.writeFileSync(metadataPath, JSON.stringify([], null, 2));
}

// Helper functions
const getMetadata = () => {
  try {
    const data = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveMetadata = (metadata) => {
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'general';
    let uploadDir = imagesDir;

    if (category === 'references') uploadDir = referencesDir;
    else if (category === 'courses') uploadDir = coursesDir;
    else if (file.mimetype.startsWith('image/')) uploadDir = imagesDir;

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use original filename (sanitized)
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, HTML, CSS, JS, JSON
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, HTML, CSS, JS, and JSON files are allowed.'));
    }
  }
});

/**
 * GET /api/assets
 * Get all uploaded assets with metadata
 */
router.get('/', (req, res) => {
  try {
    const metadata = getMetadata();
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * POST /api/assets/upload
 * Upload a new asset
 */
router.post('/upload', upload.single('asset'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const metadata = getMetadata();
    
    // Determine the relative path for frontend access
    // Store relative path (inside assets directory) without leading slash
    const relativePath = path.relative(
      assetsDir,
      req.file.path
    ).replace(/\\/g, '/');

    const assetInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      // relativePath is used server-side to locate file. url is what front-end should use.
      relativePath: relativePath,
      url: `/assets/${relativePath}`,
      type: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'general',
      uploadedAt: new Date().toISOString()
    };

    metadata.push(assetInfo);
    saveMetadata(metadata);

    res.status(201).json(assetInfo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload asset: ' + error.message });
  }
});

/**
 * DELETE /api/assets/:filename
 * Delete an asset
 */
router.delete('/:filename', (req, res) => {
  try {
    const metadata = getMetadata();
  const assetIndex = metadata.findIndex(a => a.filename === req.params.filename);

    if (assetIndex === -1) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = metadata[assetIndex];

    // Delete the actual file using stored relativePath
    try {
      const rel = asset.relativePath || asset.path || '';
      const filePath = path.join(assetsDir, rel);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Failed to delete asset file:', err.message);
      // continue to remove metadata even if file delete fails
    }

    // Remove from metadata
    metadata.splice(assetIndex, 1);
    saveMetadata(metadata);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

/**
 * GET /api/assets/categories
 * Get available asset categories
 */
router.get('/categories', (req, res) => {
  try {
    const metadata = getMetadata();
    const categories = [...new Set(metadata.map(a => a.category))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
