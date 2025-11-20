/**
 * Image Storage Service
 * Unified service for storing images in both database (BLOB) and file system
 * Provides redundancy and easy retrieval
 */

const fs = require('fs');
const path = require('path');
const { query, queryOne } = require('../database/connection');

class ImageStorageService {
  constructor() {
    this.screenshotDir = path.join(__dirname, '../screenshots');
    this.assetsDir = path.join(__dirname, '../assets');
    
    // Ensure directories exist
    [this.screenshotDir, this.assetsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Store screenshot in database for a submission
   * @param {string} submissionId - Submission ID
   * @param {string} filePath - Path to screenshot file
   * @param {string} type - Type: 'user', 'expected', or 'diff'
   */
  async storeSubmissionScreenshot(submissionId, filePath, type) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Determine column name
      let column;
      switch(type) {
        case 'user':
          column = 'user_screenshot_data';
          break;
        case 'expected':
          column = 'expected_screenshot_data';
          break;
        case 'diff':
          column = 'diff_screenshot_data';
          break;
        default:
          throw new Error(`Invalid screenshot type: ${type}`);
      }

      // Store in database
      await query(
        `UPDATE submissions SET ${column} = ? WHERE id = ?`,
        [fileBuffer, submissionId]
      );

      console.log(`✓ Stored ${type} screenshot for submission ${submissionId} in database`);
      return true;
    } catch (error) {
      console.error(`Failed to store ${type} screenshot in database:`, error.message);
      return false;
    }
  }

  /**
   * Retrieve screenshot from database
   * @param {string} submissionId - Submission ID
   * @param {string} type - Type: 'user', 'expected', or 'diff'
   * @returns {Buffer|null} - Image buffer
   */
  async getSubmissionScreenshot(submissionId, type) {
    try {
      let column;
      switch(type) {
        case 'user':
          column = 'user_screenshot_data';
          break;
        case 'expected':
          column = 'expected_screenshot_data';
          break;
        case 'diff':
          column = 'diff_screenshot_data';
          break;
        default:
          throw new Error(`Invalid screenshot type: ${type}`);
      }

      const result = await queryOne(
        `SELECT ${column} FROM submissions WHERE id = ?`,
        [submissionId]
      );

      if (result && result[column]) {
        return result[column];
      }
      
      // Fallback to file system if not in database
      const filename = `${submissionId}-${type}.png`;
      const filePath = path.join(this.screenshotDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`⚠ Screenshot retrieved from filesystem (not in DB): ${filename}`);
        return fs.readFileSync(filePath);
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve ${type} screenshot:`, error.message);
      return null;
    }
  }

  /**
   * Store asset in database
   * @param {Object} assetInfo - Asset metadata
   * @param {string} filePath - Path to asset file
   */
  async storeAsset(assetInfo, filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      await query(
        `INSERT INTO assets (filename, original_name, path, url, type, size, category, file_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         file_data = VALUES(file_data),
         size = VALUES(size),
         uploaded_at = CURRENT_TIMESTAMP`,
        [
          assetInfo.filename,
          assetInfo.originalName,
          assetInfo.relativePath,
          assetInfo.url,
          assetInfo.type,
          assetInfo.size,
          assetInfo.category || 'general',
          fileBuffer
        ]
      );

      console.log(`✓ Stored asset ${assetInfo.filename} in database`);
      return true;
    } catch (error) {
      console.error(`Failed to store asset in database:`, error.message);
      return false;
    }
  }

  /**
   * Retrieve asset from database
   * @param {string} filename - Asset filename
   * @returns {Object|null} - { data: Buffer, type: string, originalName: string }
   */
  async getAsset(filename) {
    try {
      const result = await queryOne(
        'SELECT file_data, type, original_name FROM assets WHERE filename = ?',
        [filename]
      );

      if (result && result.file_data) {
        return {
          data: result.file_data,
          type: result.type,
          originalName: result.original_name
        };
      }

      // Fallback to filesystem
      const categories = ['images', 'references', 'courses'];
      for (const category of categories) {
        const filePath = path.join(this.assetsDir, category, filename);
        if (fs.existsSync(filePath)) {
          console.log(`⚠ Asset retrieved from filesystem (not in DB): ${filename}`);
          return {
            data: fs.readFileSync(filePath),
            type: this._getMimeType(filename),
            originalName: filename
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve asset:`, error.message);
      return null;
    }
  }

  /**
   * Get all assets metadata
   * @returns {Array} - Array of asset metadata
   */
  async getAllAssets() {
    try {
      const assets = await query(
        'SELECT id, filename, original_name, url, type, size, category, uploaded_at FROM assets ORDER BY uploaded_at DESC'
      );
      return assets.map(asset => ({
        id: asset.id,
        filename: asset.filename,
        originalName: asset.original_name,
        url: asset.url,
        type: asset.type,
        size: asset.size,
        category: asset.category,
        uploadedAt: asset.uploaded_at
      }));
    } catch (error) {
      console.error('Failed to get assets from database:', error.message);
      return [];
    }
  }

  /**
   * Delete asset from database
   * @param {string} filename - Asset filename
   */
  async deleteAsset(filename) {
    try {
      await query('DELETE FROM assets WHERE filename = ?', [filename]);
      console.log(`✓ Deleted asset ${filename} from database`);
      return true;
    } catch (error) {
      console.error(`Failed to delete asset from database:`, error.message);
      return false;
    }
  }

  /**
   * Store expected screenshot for challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} filePath - Path to screenshot file
   */
  async storeChallengeScreenshot(challengeId, filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      await query(
        'UPDATE challenges SET expected_screenshot_data = ? WHERE id = ?',
        [fileBuffer, challengeId]
      );

      console.log(`✓ Stored expected screenshot for challenge ${challengeId} in database`);
      return true;
    } catch (error) {
      console.error(`Failed to store challenge screenshot:`, error.message);
      return false;
    }
  }

  /**
   * Get expected screenshot for challenge
   * @param {string} challengeId - Challenge ID
   * @returns {Buffer|null} - Image buffer
   */
  async getChallengeScreenshot(challengeId) {
    try {
      const result = await queryOne(
        'SELECT expected_screenshot_data FROM challenges WHERE id = ?',
        [challengeId]
      );

      if (result && result.expected_screenshot_data) {
        return result.expected_screenshot_data;
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve challenge screenshot:`, error.message);
      return null;
    }
  }

  /**
   * Get MIME type from filename
   * @param {string} filename - Filename
   * @returns {string} - MIME type
   */
  _getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = new ImageStorageService();
