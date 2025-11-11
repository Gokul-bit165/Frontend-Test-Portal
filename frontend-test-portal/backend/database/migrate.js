/**
 * Data Migration Script
 * Migrates data from JSON files to MySQL database
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { query } = require('./connection');

// Read JSON files
const readJSON = (filename) => {
  const filePath = path.join(__dirname, '../data', filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
};

// Helper to format date for MySQL
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// Migrate Users
async function migrateUsers() {
  console.log('📤 Migrating users...');
  const users = readJSON('users.json');
  
  for (const user of users) {
    await query(
      `INSERT INTO users (id, username, password, email, full_name, role, created_at, last_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       email = VALUES(email),
       full_name = VALUES(full_name),
       last_login = VALUES(last_login)`,
      [
        user.id,
        user.username,
        user.password,
        user.email,
        user.fullName || user.full_name,
        user.role,
        formatDate(user.createdAt) || formatDate(new Date()),
        formatDate(user.lastLogin)
      ]
    );
  }
  console.log(`✅ Migrated ${users.length} users`);
}

// Migrate Courses
async function migrateCourses() {
  console.log('📤 Migrating courses...');
  const courses = readJSON('courses.json');
  
  for (const course of courses) {
    await query(
      `INSERT INTO courses (id, title, description, thumbnail, icon, color, total_levels, estimated_time, difficulty, tags, is_locked, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       description = VALUES(description),
       thumbnail = VALUES(thumbnail),
       total_levels = VALUES(total_levels)`,
      [
        course.id,
        course.title,
        course.description,
        course.thumbnail || null,
        course.icon || '📚',
        course.color || '#3B82F6',
        course.totalLevels || 1,
        course.estimatedTime || '1 hour',
        course.difficulty || 'Beginner',
        JSON.stringify(course.tags || []),
        course.isLocked || false,
        formatDate(course.createdAt) || formatDate(new Date())
      ]
    );
  }
  console.log(`✅ Migrated ${courses.length} courses`);
}

// Migrate Challenges
async function migrateChallenges() {
  console.log('📤 Migrating challenges...');
  const challenges = readJSON('challenges.json');
  
  for (const challenge of challenges) {
    await query(
      `INSERT INTO challenges (id, title, difficulty, description, instructions, tags, time_limit, passing_threshold, expected_html, expected_css, expected_js, expected_screenshot_url, course_id, level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       description = VALUES(description),
       instructions = VALUES(instructions)`,
      [
        challenge.id,
        challenge.title,
        challenge.difficulty || 'Medium',
        challenge.description,
        challenge.instructions,
        JSON.stringify(challenge.tags || []),
        challenge.timeLimit || 30,
        JSON.stringify(challenge.passingThreshold || {}),
        challenge.expectedSolution?.html || challenge.expectedHtml || '',
        challenge.expectedSolution?.css || challenge.expectedCss || '',
        challenge.expectedSolution?.js || challenge.expectedJs || '',
        challenge.expectedScreenshotUrl || null,
        challenge.courseId || null,
        challenge.level || 1,
        formatDate(challenge.createdAt) || formatDate(new Date()),
        formatDate(challenge.updatedAt) || formatDate(new Date())
      ]
    );
  }
  console.log(`✅ Migrated ${challenges.length} challenges`);
}

// Migrate Submissions
async function migrateSubmissions() {
  console.log('📤 Migrating submissions...');
  const submissions = readJSON('submissions.json');
  
  let count = 0;
  for (const submission of submissions) {
    // Check if user and challenge exist
    const userExists = await query('SELECT id FROM users WHERE id = ?', [submission.userId || 'user-demo-student']);
    const challengeExists = await query('SELECT id FROM challenges WHERE id = ?', [submission.challengeId]);
    
    if (userExists.length === 0 || challengeExists.length === 0) {
      continue; // Skip if references don't exist
    }

    await query(
      `INSERT INTO submissions (id, challenge_id, user_id, candidate_name, html_code, css_code, js_code, status, submitted_at, evaluated_at, structure_score, visual_score, content_score, final_score, passed, evaluation_result)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       final_score = VALUES(final_score)`,
      [
        submission.id,
        submission.challengeId,
        submission.userId || 'user-demo-student',
        submission.candidateName || 'Anonymous',
        submission.code?.html || '',
        submission.code?.css || '',
        submission.code?.js || '',
        submission.status || 'pending',
        formatDate(submission.submittedAt) || formatDate(new Date()),
        formatDate(submission.evaluatedAt),
        submission.result?.structureScore || 0,
        submission.result?.visualScore || 0,
        submission.result?.contentScore || 0,
        submission.result?.finalScore || 0,
        submission.result?.passed || false,
        JSON.stringify(submission.result || {})
      ]
    );
    count++;
  }
  console.log(`✅ Migrated ${count} submissions`);
}

// Migrate User Progress
async function migrateUserProgress() {
  console.log('📤 Migrating user progress...');
  const progressFile = path.join(__dirname, '../data/user-progress.json');
  
  if (!fs.existsSync(progressFile)) {
    console.log('⚠️  No user progress data found');
    return;
  }

  const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
  
  let count = 0;
  for (const userProgress of progressData) {
    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE id = ?', [userProgress.userId]);
    if (userExists.length === 0) {
      console.log(`⚠️  Skipping progress for non-existent user: ${userProgress.userId}`);
      continue;
    }

    for (const course of userProgress.courses || []) {
      // Check if course exists
      const courseExists = await query('SELECT id FROM courses WHERE id = ?', [course.courseId]);
      if (courseExists.length === 0) {
        console.log(`⚠️  Skipping progress for non-existent course: ${course.courseId}`);
        continue;
      }

      await query(
        `INSERT INTO user_progress (user_id, course_id, current_level, completed_levels, total_points)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         current_level = VALUES(current_level),
         completed_levels = VALUES(completed_levels),
         total_points = VALUES(total_points)`,
        [
          userProgress.userId,
          course.courseId,
          course.currentLevel || 1,
          JSON.stringify(course.completedLevels || []),
          course.totalPoints || 0
        ]
      );
      count++;
    }
  }
  console.log(`✅ Migrated ${count} progress records`);
}

// Migrate User Assignments
async function migrateUserAssignments() {
  console.log('📤 Migrating user assignments...');
  const assignmentsFile = path.join(__dirname, '../data/user-assignments.json');
  
  if (!fs.existsSync(assignmentsFile)) {
    console.log('⚠️  No user assignments data found');
    return;
  }

  const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
  
  let count = 0;
  for (const assignment of assignments) {
    // Check if user and course exist
    const userExists = await query('SELECT id FROM users WHERE id = ?', [assignment.userId]);
    const courseExists = await query('SELECT id FROM courses WHERE id = ?', [assignment.courseId]);
    
    if (userExists.length === 0) {
      console.log(`⚠️  Skipping assignment for non-existent user: ${assignment.userId}`);
      continue;
    }
    
    if (courseExists.length === 0) {
      console.log(`⚠️  Skipping assignment for non-existent course: ${assignment.courseId}`);
      continue;
    }

    // Insert each assigned question as a separate row
    for (const questionId of assignment.assignedQuestions || []) {
      const challengeExists = await query('SELECT id FROM challenges WHERE id = ?', [questionId]);
      
      if (challengeExists.length === 0) {
        console.log(`⚠️  Skipping assignment for non-existent challenge: ${questionId}`);
        continue;
      }

      await query(
        `INSERT INTO user_assignments (user_id, course_id, level, challenge_id, assigned_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         challenge_id = VALUES(challenge_id)`,
        [
          assignment.userId,
          assignment.courseId,
          assignment.level,
          questionId,
          formatDate(assignment.assignedAt) || formatDate(new Date())
        ]
      );
      count++;
    }
  }
  console.log(`✅ Migrated ${count} assignments`);
}

// Migrate Assets Metadata
async function migrateAssets() {
  console.log('📤 Migrating assets...');
  const assetsFile = path.join(__dirname, '../data/assets-metadata.json');
  
  if (!fs.existsSync(assetsFile)) {
    console.log('⚠️  No assets metadata found');
    return;
  }

  const assets = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
  
  for (const asset of assets) {
    await query(
      `INSERT INTO assets (filename, original_name, path, url, type, size, category, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       path = VALUES(path),
       url = VALUES(url)`,
      [
        asset.filename || '',
        asset.originalName || asset.filename || '',
        asset.relativePath || asset.path || '',
        asset.url || '',
        asset.type || 'application/octet-stream',
        asset.size || 0,
        asset.category || 'general',
        formatDate(asset.uploadedAt) || formatDate(new Date())
      ]
    );
  }
  console.log(`✅ Migrated ${assets.length} assets`);
}

// Main migration function
async function runMigration() {
  console.log('\n🚀 Starting data migration from JSON to MySQL...\n');
  
  try {
    await migrateUsers();
    await migrateCourses();
    await migrateChallenges();
    await migrateSubmissions();
    await migrateUserProgress();
    await migrateUserAssignments();
    await migrateAssets();
    
    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
