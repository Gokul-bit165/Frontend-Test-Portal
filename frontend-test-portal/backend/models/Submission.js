/**
 * Submission Model
 * Database operations for submissions table
 */

const { query, queryOne } = require('../database/connection');

class SubmissionModel {
  // Get all submissions
  static async findAll() {
    const submissions = await query('SELECT * FROM submissions ORDER BY submitted_at DESC');
    return submissions.map(this._formatSubmission);
  }

  // Get submission by ID
  static async findById(id) {
    const submission = await queryOne('SELECT * FROM submissions WHERE id = ?', [id]);
    return submission ? this._formatSubmission(submission) : null;
  }

  // Get submissions by user
  static async findByUser(userId) {
    const submissions = await query(
      'SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC',
      [userId]
    );
    return submissions.map(this._formatSubmission);
  }

  // Get submissions by challenge
  static async findByChallenge(challengeId) {
    const submissions = await query(
      'SELECT * FROM submissions WHERE challenge_id = ? ORDER BY submitted_at DESC',
      [challengeId]
    );
    return submissions.map(this._formatSubmission);
  }

  // Create new submission
  static async create(submissionData) {
    const id = submissionData.id || `sub-${Date.now()}`;
    await query(
      `INSERT INTO submissions (id, challenge_id, user_id, candidate_name, html_code, css_code, js_code, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        submissionData.challengeId,
        submissionData.userId || 'user-demo-student',
        submissionData.candidateName || 'Anonymous',
        submissionData.code?.html || '',
        submissionData.code?.css || '',
        submissionData.code?.js || '',
        submissionData.status || 'pending',
        submissionData.submittedAt || new Date()
      ]
    );
    return await this.findById(id);
  }

  // Update submission with evaluation result
  static async updateEvaluation(id, evaluationData) {
    // Extract screenshot paths from evaluation result (visual.screenshots preferred)
    const screenshots = evaluationData.visual?.screenshots || evaluationData.pixel?.screenshots || {};
    const userScreenshot = screenshots.candidate || null;
    const expectedScreenshot = screenshots.expected || null;
    
    await query(
      `UPDATE submissions SET
       status = ?,
       evaluated_at = NOW(),
       structure_score = ?,
       visual_score = ?,
       content_score = ?,
       final_score = ?,
       passed = ?,
       evaluation_result = ?,
       user_screenshot = ?,
       expected_screenshot = ?
       WHERE id = ?`,
      [
        evaluationData.passed ? 'passed' : 'failed',
        evaluationData.structureScore || 0,
        evaluationData.visualScore || 0,
        evaluationData.contentScore || 0,
        evaluationData.finalScore || 0,
        evaluationData.passed || false,
        JSON.stringify(evaluationData),
        userScreenshot,
        expectedScreenshot,
        id
      ]
    );
    return await this.findById(id);
  }

  // Delete submission
  static async delete(id) {
    await query('DELETE FROM submissions WHERE id = ?', [id]);
  }

  // Get submission count
  static async count() {
    const result = await queryOne('SELECT COUNT(*) as count FROM submissions');
    return result.count;
  }

  // Get recent submissions (for dashboard)
  static async getRecent(limit = 10) {
    const submissions = await query(
      'SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT ?',
      [limit]
    );
    return submissions.map(this._formatSubmission);
  }

  // Format submission for response
  static _formatSubmission(submission) {
    return {
      id: submission.id,
      challengeId: submission.challenge_id,
      userId: submission.user_id,
      candidateName: submission.candidate_name,
      code: {
        html: submission.html_code,
        css: submission.css_code,
        js: submission.js_code
      },
      status: submission.status,
      submittedAt: submission.submitted_at,
      evaluatedAt: submission.evaluated_at,
      user_screenshot: submission.user_screenshot,
      expected_screenshot: submission.expected_screenshot,
      total_score: submission.final_score,
      result: submission.evaluation_result ? (
        typeof submission.evaluation_result === 'string' 
          ? JSON.parse(submission.evaluation_result) 
          : submission.evaluation_result
      ) : {
        structureScore: submission.structure_score,
        visualScore: submission.visual_score,
        contentScore: submission.content_score,
        finalScore: submission.final_score,
        passed: Boolean(submission.passed)
      }
    };
  }
}

module.exports = SubmissionModel;
