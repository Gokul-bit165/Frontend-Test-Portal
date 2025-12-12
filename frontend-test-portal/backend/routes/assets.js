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

// Custom file filter to check for duplicates
const fileFilter = (req, file, cb) => {
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

  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only images, HTML, CSS, JS, and JSON files are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter
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
    const metadata = getMetadata();

    // Check if file already exists in metadata (by original filename)
    // Note: multer.diskStorage has already saved the file by the time we get here. 
    // To properly "skip", we should ideally check before multer saves, but multer doesn't easily support that async check in fileFilter without custom storage.
    // Instead, we can check if the file resulted in a duplicate name in our system logic.

    // However, a better approach for the user request "skip that not store duplicate" 
    // is to check if we already have this asset in our metadata.

    // If multer saved it, we might want to delete the newly saved duplicate if we decide to reuse the old one.
    // But since multer's filename function sanitizes and might create unique names, let's see.

    // Let's refine the logic:
    // 1. We look at the uploaded file info.
    // 2. We check if an asset with the SAME originalName already exists in the requested category.

    // If we find a match:
    // - We delete the file that Multer just saved (since it's a duplicate upload).
    // - We return the EXISTING asset info.

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const category = req.body.category || 'general';
    const originalName = req.file.originalname;

    const existingAsset = metadata.find(a =>
      a.originalName === originalName &&
      (a.category === category || (!a.category && category === 'general'))
    );

    if (existingAsset) {
      // Duplicate found!
      console.log(`Duplicate asset upload detected: ${originalName}. Using existing asset.`);

      // Delete the file Multer just created to avoid clutter
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Return existing asset with 200 OK (not 201 Created)
      return res.status(200).json(existingAsset);
    }

    // New Asset Logic

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
      category: category,
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
