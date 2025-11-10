/**
 * Course Model
 * Database operations for courses table
 */

const { query, queryOne } = require('../database/connection');

class CourseModel {
  // Get all courses
  static async findAll() {
    const courses = await query('SELECT * FROM courses ORDER BY created_at DESC');
    // Parse JSON fields
    return courses.map(course => ({
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      isLocked: Boolean(course.is_locked),
      totalLevels: course.total_levels,
      estimatedTime: course.estimated_time
    }));
  }

  // Get course by ID
  static async findById(id) {
    const course = await queryOne('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) return null;
    return {
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      isLocked: Boolean(course.is_locked),
      totalLevels: course.total_levels,
      estimatedTime: course.estimated_time
    };
  }

  // Create new course
  static async create(courseData) {
    const id = courseData.id || `course-${Date.now()}`;
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
    await query('DELETE FROM courses WHERE id = ?', [id]);
  }

  // Get course count
  static async count() {
    const result = await queryOne('SELECT COUNT(*) as count FROM courses');
    return result.count;
  }
}

module.exports = CourseModel;
