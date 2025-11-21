/**
 * Admin Routes
 * Handles admin authentication and challenge management
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import models for MySQL support
const SubmissionModel = require('../models/Submission');
const UserModel = require('../models/User');
const { USE_JSON } = require('../database/connection');

const usersPath = path.join(__dirname, '../data/users.json');
const challengesPath = path.join(__dirname, '../data/challenges.json');
const submissionsPath = path.join(__dirname, '../data/submissions.json');

// Helper functions
const getUsers = () => {
  const data = fs.readFileSync(usersPath, 'utf8');
  return JSON.parse(data);
};

const getChallenges = () => {
  const data = fs.readFileSync(challengesPath, 'utf8');
  return JSON.parse(data);
};

const saveChallenges = (challenges) => {
  fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
};

const getSubmissions = () => {
  const data = fs.readFileSync(submissionsPath, 'utf8');
  return JSON.parse(data);
};

/**
 * POST /api/admin/login
 * Admin authentication
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // Hash the provided password and compare
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate admin token
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.fullName || user.name,
        role: user.role
      },
      token: token
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/admin/challenges
 * Get all challenges with solutions (admin only)
 */
router.get('/challenges', (req, res) => {
  try {
    // TODO: Add token verification middleware
    const challenges = getChallenges();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

/**
 * POST /api/admin/challenges
 * Create new challenge
 * Body: { challenge object }
 */
router.post('/challenges', (req, res) => {
  try {
    const challenges = getChallenges();
    
    const newChallenge = {
      id: `ch-${uuidv4().slice(0, 8)}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    challenges.push(newChallenge);
    saveChallenges(challenges);
    
    res.status(201).json({
      message: 'Challenge created',
      challenge: newChallenge
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

/**
 * PUT /api/admin/challenges/:id
 * Update existing challenge
 */
router.put('/challenges/:id', (req, res) => {
  try {
    const challenges = getChallenges();
    const index = challenges.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    challenges[index] = {
      ...challenges[index],
      ...req.body,
      id: req.params.id, // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    saveChallenges(challenges);
    
    res.json({
      message: 'Challenge updated',
      challenge: challenges[index]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

/**
 * DELETE /api/admin/challenges/:id
 * Delete challenge
 */
router.delete('/challenges/:id', (req, res) => {
  try {
    const challenges = getChallenges();
    const filtered = challenges.filter(c => c.id !== req.params.id);
    
    if (filtered.length === challenges.length) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    saveChallenges(filtered);
    
    res.json({ message: 'Challenge deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

/**
 * GET /api/admin/submissions
 * Get all submissions with results
 */
router.get('/submissions', async (req, res) => {
  try {
    if (USE_JSON) {
      const submissions = getSubmissions();
      res.json(submissions);
    } else {
      // Fetch from MySQL with user and challenge details
      const submissions = await SubmissionModel.findAll();
      res.json(submissions);
    }
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * POST /api/admin/evaluate/:submissionId
 * Re-run evaluation for a submission
 */
router.post('/evaluate/:submissionId', async (req, res) => {
  try {
    const evaluator = require('../services/evaluator');
    const submissions = getSubmissions();
    const challenges = getChallenges();
    
    const submission = submissions.find(s => s.id === req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const challenge = challenges.find(c => c.id === submission.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Re-evaluate
    const result = await evaluator.evaluate(
      submission.code,
      challenge.expectedSolution,
      challenge.passingThreshold,
      submission.id
    );
    
    // Update submission
    submission.result = result;
    submission.status = result.passed ? 'passed' : 'failed';
    submission.evaluatedAt = new Date().toISOString();
    
    const index = submissions.findIndex(s => s.id === req.params.submissionId);
    submissions[index] = submission;
    fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    
    res.json({ message: 'Re-evaluation complete', result });
  } catch (error) {
    res.status(500).json({ error: 'Re-evaluation failed', details: error.message });
  }
});

/**
 * GET /api/admin/submissions/grouped
 * Get submissions grouped by test session with user details
 */
router.get('/submissions/grouped', async (req, res) => {
  try {
    const db = require('../database/connection');
    
    // Query to get test sessions with user info and submission details
    const query = `
      SELECT 
        ts.id as session_id,
        ts.user_id,
        ts.course_id,
        ts.level,
        ts.started_at,
        ts.completed_at,
        ts.total_questions,
        ts.passed_count,
        ts.overall_status,
        ts.user_feedback,
        COALESCE(u.full_name, u.username, ts.user_id) as user_name,
        u.email as user_email,
        ts.submission_ids
      FROM test_sessions ts
      LEFT JOIN users u ON ts.user_id = u.id
      ORDER BY ts.started_at DESC
    `;
    
    const sessions = await db.query(query);
    
    // For each session, get the detailed submissions
    const groupedSessions = await Promise.all(sessions.map(async (session) => {
      let submissions = [];
      
      if (session.submission_ids) {
        // Normalize submission_ids returned by MySQL2 (could be string, array, Buffer, or object)
        let submissionIds = [];
        const rawSubmissionIds = session.submission_ids;

        if (Array.isArray(rawSubmissionIds)) {
          submissionIds = rawSubmissionIds;
        } else if (typeof rawSubmissionIds === 'string') {
          try {
            submissionIds = JSON.parse(rawSubmissionIds);
          } catch (e) {
            console.error('Error parsing submission_ids string:', e);
          }
        } else if (Buffer.isBuffer(rawSubmissionIds)) {
          try {
            submissionIds = JSON.parse(rawSubmissionIds.toString('utf8'));
          } catch (e) {
            console.error('Error parsing submission_ids buffer:', e);
          }
        } else if (typeof rawSubmissionIds === 'object') {
          // Already parsed JSON from MySQL2 - ensure it is an array
          if (Array.isArray(rawSubmissionIds)) {
            submissionIds = rawSubmissionIds;
          } else {
            submissionIds = Object.values(rawSubmissionIds);
          }
        }

        submissionIds = Array.isArray(submissionIds) ? submissionIds.filter(Boolean) : [];
        
        if (submissionIds.length > 0) {
          const placeholders = submissionIds.map(() => '?').join(',');
          const submissionsQuery = `
            SELECT 
              id, 
              challenge_id, 
              status, 
              passed,
              final_score,
              submitted_at
            FROM submissions
            WHERE id IN (${placeholders})
            ORDER BY submitted_at ASC
          `;
          
          submissions = await db.query(submissionsQuery, submissionIds);
        }
      }
      
      return {
        session_id: session.session_id,
        user: {
          id: session.user_id,
          name: session.user_name,
          email: session.user_email || 'N/A'
        },
        course_id: session.course_id,
        level: session.level,
        started_at: session.started_at,
        completed_at: session.completed_at,
        total_questions: session.total_questions || 0,
        passed_count: session.passed_count || 0,
        overall_status: session.overall_status,
        user_feedback: session.user_feedback,
        submissions: submissions.map(s => ({
          id: s.id,
          challenge_id: s.challenge_id,
          status: s.status,
          passed: s.passed === 1,
          final_score: s.final_score || 0,
          submitted_at: s.submitted_at
        }))
      };
    }));
    
    res.json(groupedSessions);
  } catch (error) {
    console.error('Failed to fetch grouped submissions:', error);
    res.status(500).json({ error: 'Failed to fetch grouped submissions', details: error.message });
  }
});

/**
 * DELETE /api/admin/submissions/:id
 * Delete a submission
 */
router.delete('/submissions/:id', async (req, res) => {
  try {
    if (USE_JSON) {
      const submissions = getSubmissions();
      const filtered = submissions.filter(s => s.id !== req.params.id);
      
      if (filtered.length === submissions.length) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Save updated submissions
      fs.writeFileSync(submissionsPath, JSON.stringify(filtered, null, 2));
    } else {
      // Delete from MySQL
      const submission = await SubmissionModel.findById(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      await SubmissionModel.delete(req.params.id);
    }
    
    // Optional: Delete associated screenshot files
    const screenshotDir = path.join(__dirname, '../screenshots');
    try {
      const screenshotFiles = [
        `${req.params.id}-candidate.png`,
        `${req.params.id}-expected.png`,
        `${req.params.id}-diff.png`
      ];
      
      screenshotFiles.forEach(file => {
        const filePath = path.join(screenshotDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (screenshotError) {
      console.warn('Failed to delete screenshots:', screenshotError.message);
      // Don't fail the request if screenshot deletion fails
    }
    
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;
