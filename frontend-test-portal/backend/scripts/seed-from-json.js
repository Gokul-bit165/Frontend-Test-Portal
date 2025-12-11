require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../database/connection');

const jsonPath = path.join(__dirname, '../data/challenges-new.json');

async function seed() {
    try {
        console.log('Reading JSON file...');
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`File not found: ${jsonPath}`);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const questions = JSON.parse(rawData);

        console.log(`Found ${questions.length} questions in JSON.`);

        console.log('Syncing to database...');
        let successCount = 0;
        let errorCount = 0;

        for (const q of questions) {
            try {
                // Prepare values for SQL
                const tags = Array.isArray(q.tags) ? JSON.stringify(q.tags) : JSON.stringify([]);
                const passingThreshold = q.passingThreshold ? JSON.stringify(q.passingThreshold) : JSON.stringify({});
                const expectedHtml = q.expectedSolution?.html || q.expectedHtml || '';
                const expectedCss = q.expectedSolution?.css || q.expectedCss || '';
                const expectedJs = q.expectedSolution?.js || q.expectedJs || '';

                // Use INSERT ... ON DUPLICATE KEY UPDATE
                await query(
                    `INSERT INTO challenges 
          (id, title, difficulty, description, instructions, tags, time_limit, passing_threshold, expected_html, expected_css, expected_js, expected_screenshot_url, course_id, level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          difficulty = VALUES(difficulty),
          description = VALUES(description),
          instructions = VALUES(instructions),
          tags = VALUES(tags),
          time_limit = VALUES(time_limit),
          passing_threshold = VALUES(passing_threshold),
          expected_html = VALUES(expected_html),
          expected_css = VALUES(expected_css),
          expected_js = VALUES(expected_js),
          expected_screenshot_url = VALUES(expected_screenshot_url),
          course_id = VALUES(course_id),
          level = VALUES(level),
          updated_at = NOW()`,
                    [
                        q.id,
                        q.title || 'Untitled',
                        q.difficulty || 'Medium',
                        q.description || '',
                        q.instructions || '',
                        tags,
                        q.timeLimit || 30,
                        passingThreshold,
                        expectedHtml,
                        expectedCss,
                        expectedJs,
                        q.assets?.reference || q.expectedScreenshotUrl || null,
                        q.courseId || 'course-fullstack',
                        q.level || 1,
                        q.createdAt || new Date(),
                        q.updatedAt || new Date()
                    ]
                );
                successCount++;
                process.stdout.write('.');
            } catch (err) {
                console.error(`\nFailed to sync question ${q.id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n\nSync complete!`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

seed();
