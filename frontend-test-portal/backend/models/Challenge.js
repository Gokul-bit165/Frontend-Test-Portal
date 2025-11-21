/**
 * Challenge Model
 * Database operations for challenges table
 */

const { query, queryOne } = require('../database/connection');

class ChallengeModel {
  // Get all challenges
  static async findAll() {
    try {
      const challenges = await query('SELECT * FROM challenges ORDER BY created_at DESC');
      return challenges.map(c => this._formatChallenge(c));
    } catch (error) {
      console.error('Error in findAll:', error.message);
      throw error;
    }
  }

  // Get challenge by ID
  static async findById(id) {
    const challenge = await queryOne('SELECT * FROM challenges WHERE id = ?', [id]);
    return challenge ? this._formatChallenge(challenge) : null;
  }

  // Get challenges by course and level
  static async findByCourseLevel(courseId, level) {
    const challenges = await query(
      'SELECT * FROM challenges WHERE course_id = ? AND level = ?',
      [courseId, level]
    );
    return challenges.map(this._formatChallenge);
  }

  // Create new challenge
  static async create(challengeData) {
    const id = challengeData.id || `challenge-${Date.now()}`;
    await query(
      `INSERT INTO challenges (id, title, difficulty, description, instructions, tags, time_limit, passing_threshold, expected_html, expected_css, expected_js, expected_screenshot_url, course_id, level, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        challengeData.title,
        challengeData.difficulty || 'Medium',
        challengeData.description,
        challengeData.instructions,
        JSON.stringify(challengeData.tags || []),
        challengeData.timeLimit || 30,
        JSON.stringify(challengeData.passingThreshold || {}),
        challengeData.expectedHtml || challengeData.expectedSolution?.html || '',
        challengeData.expectedCss || challengeData.expectedSolution?.css || '',
        challengeData.expectedJs || challengeData.expectedSolution?.js || '',
        challengeData.expectedScreenshotUrl || null,
        challengeData.courseId || null,
        challengeData.level || 1,
        challengeData.createdAt || new Date()
      ]
    );
    return await this.findById(id);
  }

  // Update challenge
  static async update(id, challengeData) {
    await query(
      `UPDATE challenges SET
       title = COALESCE(?, title),
       difficulty = COALESCE(?, difficulty),
       description = COALESCE(?, description),
       instructions = COALESCE(?, instructions),
       tags = COALESCE(?, tags),
       time_limit = COALESCE(?, time_limit),
       passing_threshold = COALESCE(?, passing_threshold),
       expected_html = COALESCE(?, expected_html),
       expected_css = COALESCE(?, expected_css),
       expected_js = COALESCE(?, expected_js),
       expected_screenshot_url = COALESCE(?, expected_screenshot_url),
       course_id = COALESCE(?, course_id),
       level = COALESCE(?, level),
       updated_at = NOW()
       WHERE id = ?`,
      [
        challengeData.title,
        challengeData.difficulty,
        challengeData.description,
        challengeData.instructions,
        challengeData.tags ? JSON.stringify(challengeData.tags) : null,
        challengeData.timeLimit,
        challengeData.passingThreshold ? JSON.stringify(challengeData.passingThreshold) : null,
        challengeData.expectedHtml || challengeData.expectedSolution?.html,
        challengeData.expectedCss || challengeData.expectedSolution?.css,
        challengeData.expectedJs || challengeData.expectedSolution?.js,
        challengeData.expectedScreenshotUrl,
        challengeData.courseId,
        challengeData.level,
        id
      ]
    );
    return await this.findById(id);
  }

  // Delete challenge
  static async delete(id) {
    await query('DELETE FROM challenges WHERE id = ?', [id]);
  }

  // Get challenge count
  static async count() {
    const result = await queryOne('SELECT COUNT(*) as count FROM challenges');
    return result.count;
  }

  // Format challenge for response
  static _formatChallenge(challenge) {
    return {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      description: challenge.description,
      instructions: challenge.instructions,
      tags: Array.isArray(challenge.tags) ? challenge.tags : JSON.parse(challenge.tags || '[]'),
      timeLimit: challenge.time_limit,
      passingThreshold: (typeof challenge.passing_threshold === 'object' && challenge.passing_threshold !== null) 
        ? challenge.passing_threshold 
        : JSON.parse(challenge.passing_threshold || '{}'),
      hints: Array.isArray(challenge.hints) ? challenge.hints : JSON.parse(challenge.hints || '[]'),
      points: challenge.points || 100,
      expectedSolution: {
        html: challenge.expected_html,
        css: challenge.expected_css,
        js: challenge.expected_js
      },
      expectedHtml: challenge.expected_html,
      expectedCss: challenge.expected_css,
      expectedJs: challenge.expected_js,
      expectedScreenshotUrl: challenge.expected_screenshot_url,
      courseId: challenge.course_id,
      level: challenge.level,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at
    };
  }
}

module.exports = ChallengeModel;
