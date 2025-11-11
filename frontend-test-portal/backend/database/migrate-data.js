/**
 * Data Migration Script
 * Migrates data from JSON files to MySQL database
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

// Create direct MySQL connection for migration
const pool = mysql.createPool({
  host: '127.0.0.1', // Direct localhost connection when running from host
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'gokul',
  database: process.env.DB_NAME || 'frontend_test_portal',
  waitForConnections: true,
  connectionLimit: 10
});

async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Helper function to read JSON files
const readJSON = (filename) => {
  const filePath = path.join(__dirname, '../data', filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Migrate Users
async function migrateUsers() {
  console.log('📦 Migrating users...');
  const users = readJSON('users.json');
  
  for (const user of users) {
    try {
      // Convert ISO date to MySQL format
      const createdAt = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      await query(
        `INSERT INTO users (id, username, password, email, full_name, role, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE username=username`,
        [
          user.id,
          user.username,
          user.password,
          user.email || `${user.username}@example.com`,
          user.fullName || user.username,
          user.role || 'student',
          createdAt
        ]
      );
    } catch (err) {
      console.error(`Error migrating user ${user.username}:`, err.message);
    }
  }
  console.log(`✅ Migrated ${users.length} users`);
}

// Migrate Courses
async function migrateCourses() {
  console.log('📦 Migrating courses...');
  const courses = readJSON('courses.json');
  
  for (const course of courses) {
    try {
      await query(
        `INSERT INTO courses (id, title, description, thumbnail, icon, color, total_levels, estimated_time, difficulty, tags, is_locked) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        [
          course.id,
          course.title,
          course.description,
          course.thumbnail,
          course.icon,
          course.color,
          course.totalLevels || 6,
          course.estimatedTime || '2 hours',
          course.difficulty || 'Beginner',
          JSON.stringify(course.tags || []),
          course.isLocked || false
        ]
      );
    } catch (err) {
      console.error(`Error migrating course ${course.title}:`, err.message);
    }
  }
  console.log(`✅ Migrated ${courses.length} courses`);
}

// Migrate Challenges
async function migrateChallenges() {
  console.log('📦 Migrating challenges...');
  const challenges = readJSON('challenges-new.json');
  
  for (const challenge of challenges) {
    try {
      await query(
        `INSERT INTO challenges (id, title, difficulty, description, instructions, expected_output, 
         html_template, css_template, js_template, test_cases, hints, tags, points, time_limit, course_id, level) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        [
          challenge.id,
          challenge.title,
          challenge.difficulty || 'Medium',
          challenge.description || '',
          challenge.instructions || '',
          challenge.expectedOutput || '',
          challenge.htmlTemplate || '',
          challenge.cssTemplate || '',
          challenge.jsTemplate || '',
          JSON.stringify(challenge.testCases || []),
          JSON.stringify(challenge.hints || []),
          JSON.stringify(challenge.tags || []),
          challenge.points || 100,
          challenge.timeLimit || 30,
          challenge.courseId || 'html-css',
          challenge.level || 1
        ]
      );
    } catch (err) {
      console.error(`Error migrating challenge ${challenge.title}:`, err.message);
    }
  }
  console.log(`✅ Migrated ${challenges.length} challenges`);
}

// Migrate User Progress
async function migrateUserProgress() {
  console.log('📦 Migrating user progress...');
  const progress = readJSON('user-progress.json');
  
  for (const p of progress) {
    try {
      await query(
        `INSERT INTO user_progress (user_id, course_id, current_level, completed_levels, total_points) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE current_level=VALUES(current_level), completed_levels=VALUES(completed_levels)`,
        [
          p.userId || 'unknown',
          p.courseId || 'html-css',
          p.currentLevel || 1,
          JSON.stringify(p.completedLevels || []),
          p.totalPoints || 0
        ]
      );
    } catch (err) {
      console.error(`Error migrating progress for ${p.userId}:`, err.message);
    }
  }
  console.log(`✅ Migrated ${progress.length} user progress records`);
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting data migration from JSON to MySQL...\n');
  console.log('Using MySQL connection:', {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'frontend_test_portal'
  }, '\n');
  
  try {
    await migrateUsers();
    await migrateCourses();
    await migrateChallenges();
    await migrateUserProgress();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 All data has been transferred to MySQL database');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
migrate();
