/**
 * Course Model
 * Database operations for courses table with JSON fallback
 */

const { query, queryOne, isConnected } = require('../database/connection');
const fs = require('fs').promises;
const path = require('path');

const COURSES_FILE = path.join(__dirname, '../data/courses.json');

class CourseModel {
  // Load courses from JSON file
  static async loadFromJSON() {
    try {
      const data = await fs.readFile(COURSES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading courses.json:', error.message);
      return [];
    }
  }

  // Save courses to JSON file
  static async saveToJSON(courses) {
    try {
      await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
    } catch (error) {
      console.error('Error writing courses.json:', error.message);
      throw error;
    }
  }

  // Get all courses
  static async findAll() {
    try {
      const courses = await query('SELECT * FROM courses ORDER BY created_at DESC');
      // Parse JSON fields (mysql2 may auto-parse JSON columns, handle both cases)
      return courses.map(course => ({
        ...course,
        tags: Array.isArray(course.tags) ? course.tags : JSON.parse(course.tags || '[]'),
        isLocked: Boolean(course.is_locked),
        totalLevels: course.total_levels,
        estimatedTime: course.estimated_time
      }));
    } catch (error) {
      console.log('Database error, falling back to JSON:', error.message);
      return await this.loadFromJSON();
    }
  }

  // Get course by ID
  static async findById(id) {
    try {
      const course = await queryOne('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) return null;
      return {
        ...course,
        tags: Array.isArray(course.tags) ? course.tags : JSON.parse(course.tags || '[]'),
        isLocked: Boolean(course.is_locked),
        totalLevels: course.total_levels,
        estimatedTime: course.estimated_time
      };
    } catch (error) {
      console.log('Database error, falling back to JSON:', error.message);
      const courses = await this.loadFromJSON();
      return courses.find(c => c.id === id) || null;
    }
  }

  // Create new course
  static async create(courseData) {
    const id = courseData.id || `course-${Date.now()}`;
    
    if (!isConnected()) {
      const courses = await this.loadFromJSON();
      const newCourse = {
        id,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail || null,
        icon: courseData.icon || '📚',
        color: courseData.color || '#3B82F6',
        totalLevels: courseData.totalLevels || 1,
        estimatedTime: courseData.estimatedTime || '1 hour',
        difficulty: courseData.difficulty || 'Beginner',
        tags: courseData.tags || [],
        isLocked: courseData.isLocked || false,
        restrictions: courseData.restrictions || {},
        levelSettings: courseData.levelSettings || {},
        createdAt: new Date().toISOString()
      };
      courses.push(newCourse);
      await this.saveToJSON(courses);
      return newCourse;
    }

    await query(
      `INSERT INTO courses (id, title, description, thumbnail, icon, color, total_levels, estimated_time, difficulty, tags, is_locked, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        courseData.title,
        courseData.description,
        courseData.thumbnail || null,
        courseData.icon || '📚',
        courseData.color || '#3B82F6',
        courseData.totalLevels || 1,
        courseData.estimatedTime || '1 hour',
        courseData.difficulty || 'Beginner',
        JSON.stringify(courseData.tags || []),
        courseData.isLocked || false,
        courseData.createdAt || new Date()
      ]
    );
    return await this.findById(id);
  }

  // Update course
  static async update(id, courseData) {
    if (!isConnected()) {
      const courses = await this.loadFromJSON();
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) return null;
      
      courses[index] = {
        ...courses[index],
        ...courseData,
        id, // Preserve ID
        updatedAt: new Date().toISOString()
      };
      await this.saveToJSON(courses);
      return courses[index];
    }

    await query(
      `UPDATE courses SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       thumbnail = COALESCE(?, thumbnail),
       icon = COALESCE(?, icon),
       color = COALESCE(?, color),
       total_levels = COALESCE(?, total_levels),
       estimated_time = COALESCE(?, estimated_time),
       difficulty = COALESCE(?, difficulty),
       tags = COALESCE(?, tags),
       is_locked = COALESCE(?, is_locked),
       updated_at = NOW()
       WHERE id = ?`,
      [
        courseData.title,
        courseData.description,
        courseData.thumbnail,
        courseData.icon,
        courseData.color,
        courseData.totalLevels,
        courseData.estimatedTime,
        courseData.difficulty,
        courseData.tags ? JSON.stringify(courseData.tags) : null,
        courseData.isLocked !== undefined ? courseData.isLocked : null,
        id
      ]
    );
    return await this.findById(id);
  }

  // Delete course
  static async delete(id) {
    if (!isConnected()) {
      const courses = await this.loadFromJSON();
      const filtered = courses.filter(c => c.id !== id);
      await this.saveToJSON(filtered);
      return;
    }

    await query('DELETE FROM courses WHERE id = ?', [id]);
  }

  // Get course count
  static async count() {
    if (!isConnected()) {
      const courses = await this.loadFromJSON();
      return courses.length;
    }

    const result = await queryOne('SELECT COUNT(*) as count FROM courses');
    return result.count;
  }
}

module.exports = CourseModel;

