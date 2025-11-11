/**
 * Generate Assets Metadata
 * Scans backend/assets directory and creates metadata entries
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const metadataPath = path.join(__dirname, '../data/assets-metadata.json');

function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return items;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'PLACEHOLDERS.md' || entry.name === 'README.md') {
      continue; // Skip documentation files
    }

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      items.push(...scanDirectory(fullPath, relPath));
    } else if (entry.isFile()) {
      // Get file stats
      const stats = fs.statSync(fullPath);
      const ext = path.extname(entry.name).toLowerCase();
      
      // Determine category based on path
      let category = 'general';
      if (relPath.includes('images/')) category = 'images';
      else if (relPath.includes('references/')) category = 'references';
      else if (relPath.includes('courses/')) category = 'courses';

      // Determine MIME type
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
      };

      const type = mimeTypes[ext] || 'application/octet-stream';

      items.push({
        filename: entry.name,
        originalName: entry.name,
        relativePath: relPath,
        url: `/assets/${relPath}`,
        type: type,
        size: stats.size,
        category: category,
        uploadedAt: stats.birthtime.toISOString()
      });
    }
  }

  return items;
}

function generateMetadata() {
  console.log('🔍 Scanning assets directory...\n');
  
  const metadata = scanDirectory(assetsDir);
  
  console.log(`✅ Found ${metadata.length} asset files\n`);
  
  // Group by category for display
  const byCategory = {};
  metadata.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  Object.keys(byCategory).forEach(cat => {
    console.log(`   ${cat}: ${byCategory[cat].length} files`);
  });

  // Save metadata
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📝 Metadata saved to: ${metadataPath}`);
  console.log(`\nSample entries:`);
  metadata.slice(0, 3).forEach(item => {
    console.log(`   - ${item.filename} (${item.category}) - ${item.url}`);
  });
}

// Run if called directly
if (require.main === module) {
  try {
    generateMetadata();
  } catch (error) {
    console.error('❌ Error generating metadata:', error);
    process.exit(1);
  }
}

module.exports = { generateMetadata };
