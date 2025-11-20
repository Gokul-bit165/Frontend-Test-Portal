/**
 * Migration Script: Move existing images to database
 * Migrates screenshots and assets from filesystem to database BLOB storage
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../database/connection');

class ImageMigration {
  constructor() {
    this.screenshotDir = path.join(__dirname, '../screenshots');
    this.assetsDir = path.join(__dirname, '../assets');
  }

  /**
   * Migrate all screenshots to database
   */
  async migrateScreenshots() {
    console.log('\n📸 Migrating screenshots to database...');
    
    if (!fs.existsSync(this.screenshotDir)) {
      console.log('No screenshots directory found, skipping.');
      return;
    }

    const files = fs.readdirSync(this.screenshotDir);
    let migratedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const filePath = path.join(this.screenshotDir, file);
      
      try {
        // Parse filename: submissionId-type.png
        const match = file.match(/^(.+)-(candidate|expected|diff)\.png$/);
        if (!match) {
          console.warn(`⚠ Skipping invalid filename: ${file}`);
          continue;
        }

        const [, submissionId, type] = match;
        const fileBuffer = fs.readFileSync(filePath);

        // Determine column based on type
        let column;
        if (type === 'candidate') column = 'user_screenshot_data';
        else if (type === 'expected') column = 'expected_screenshot_data';
        else if (type === 'diff') column = 'diff_screenshot_data';

        // Update submission with screenshot data
        await query(
          `UPDATE submissions SET ${column} = ? WHERE id = ?`,
          [fileBuffer, submissionId]
        );

        migratedCount++;
        console.log(`✓ Migrated ${file}`);
      } catch (error) {
        console.error(`✗ Failed to migrate ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✓ Screenshot migration complete: ${migratedCount} migrated, ${errorCount} errors`);
  }

  /**
   * Migrate all assets to database
   */
  async migrateAssets() {
    console.log('\n🖼️  Migrating assets to database...');

    const categories = ['images', 'references', 'courses'];
    let migratedCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      const categoryDir = path.join(this.assetsDir, category);
      
      if (!fs.existsSync(categoryDir)) {
        console.log(`Category ${category} not found, skipping.`);
        continue;
      }

      const files = fs.readdirSync(categoryDir);

      for (const file of files) {
        const filePath = path.join(categoryDir, file);
        
        // Skip directories
        if (fs.statSync(filePath).isDirectory()) continue;

        try {
          const fileBuffer = fs.readFileSync(filePath);
          const stats = fs.statSync(filePath);
          const mimeType = this._getMimeType(file);

          await query(
            `INSERT INTO assets (filename, original_name, path, url, type, size, category, file_data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             file_data = VALUES(file_data),
             size = VALUES(size),
             uploaded_at = CURRENT_TIMESTAMP`,
            [
              file,
              file,
              `${category}/${file}`,
              `/api/assets/file/${file}`,
              mimeType,
              stats.size,
              category,
              fileBuffer
            ]
          );

          migratedCount++;
          console.log(`✓ Migrated ${category}/${file}`);
        } catch (error) {
          console.error(`✗ Failed to migrate ${category}/${file}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`\n✓ Asset migration complete: ${migratedCount} migrated, ${errorCount} errors`);
  }

  /**
   * Get MIME type from filename
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

  /**
   * Run complete migration
   */
  async run() {
    console.log('🚀 Starting image migration to database...\n');
    
    try {
      await this.migrateScreenshots();
      await this.migrateAssets();
      
      console.log('\n✅ Migration complete! All images stored in database.');
      console.log('💡 Original files preserved for backup.');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run migration if executed directly
if (require.main === module) {
  const migration = new ImageMigration();
  migration.run();
}

module.exports = ImageMigration;
