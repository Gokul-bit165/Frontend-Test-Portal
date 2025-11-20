/**
 * Migrate submissions from JSON to TiDB
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../database/connection');

async function migrateSubmissions() {
  try {
    console.log('🚀 Starting submissions migration...\n');

    // Load JSON file
    const jsonPath = path.join(__dirname, '../data/submissions.json');
    const submissions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📦 Found ${submissions.length} submissions in JSON file\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const submission of submissions) {
      try {
        // Check if already exists
        const existing = await query(
          'SELECT id FROM submissions WHERE id = ?',
          [submission.id]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${submission.id} - already exists`);
          skipped++;
          continue;
        }

        // Extract screenshot paths from result if available
        let userScreenshot = null;
        let expectedScreenshot = null;
        
        if (submission.result && submission.result.visual && submission.result.visual.screenshots) {
          userScreenshot = submission.result.visual.screenshots.candidate || null;
          expectedScreenshot = submission.result.visual.screenshots.expected || null;
        }

        // Insert into database
        await query(
          `INSERT INTO submissions 
          (id, challenge_id, user_id, candidate_name, html_code, css_code, js_code, 
           status, submitted_at, evaluated_at, structure_score, visual_score, 
           content_score, final_score, passed, evaluation_result, user_screenshot, expected_screenshot)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            submission.id,
            submission.challengeId,
            submission.userId || 'user-demo-student',
            submission.candidateName || 'Anonymous',
            submission.code?.html || '',
            submission.code?.css || '',
            submission.code?.js || '',
            submission.status || 'pending',
            submission.submittedAt,
            submission.evaluatedAt || null,
            submission.result?.structureScore || 0,
            submission.result?.visualScore || 0,
            submission.result?.contentScore || 0,
            submission.result?.finalScore || 0,
            submission.status === 'passed' ? 1 : 0,
            submission.result ? JSON.stringify(submission.result) : null,
            userScreenshot,
            expectedScreenshot
          ]
        );

        console.log(`✅ Migrated: ${submission.id} (${submission.candidateName})`);
        migrated++;
      } catch (err) {
        console.error(`❌ Error migrating ${submission.id}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSubmissions();
