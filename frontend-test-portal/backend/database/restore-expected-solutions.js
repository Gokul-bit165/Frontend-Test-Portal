/**
 * Restore Expected Solutions from Git History
 * This script restores the expected HTML/CSS/JS solutions that were in the database before
 */

const { query } = require('./connection');
const fs = require('fs');

async function restoreExpectedSolutions() {
  try {
    console.log('📥 Loading challenges data from backup file...');
    
    // Read the challenges-restore.json file
    const dataPath = __dirname + '/../data/challenges-restore.json';
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const challenges = JSON.parse(fileData);
    
    console.log(`✅ Found ${challenges.length} challenges in git history`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const challenge of challenges) {
      const { id, expectedSolution } = challenge;
      
      if (!expectedSolution || (!expectedSolution.html && !expectedSolution.css && !expectedSolution.js)) {
        console.log(`⏭️  Skipping ${id} - no expected solution`);
        skipped++;
        continue;
      }
      
      try {
        await query(
          `UPDATE challenges 
           SET expected_html = ?,
               expected_css = ?,
               expected_js = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [
            expectedSolution.html || '',
            expectedSolution.css || '',
            expectedSolution.js || '',
            id
          ]
        );
        
        console.log(`✅ Updated ${id}`);
        updated++;
      } catch (err) {
        console.error(`❌ Error updating ${id}:`, err.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${challenges.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit();
  }
}

restoreExpectedSolutions();
