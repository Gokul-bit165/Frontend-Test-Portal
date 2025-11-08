/**
 * Admin Routes
 * Handles admin authentication and challenge management
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // In production, generate JWT token here
    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      },
      // Mock token for prototype
      token: `mock-token-${Date.now()}`
    });
    
  } catch (error) {
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
router.get('/submissions', (req, res) => {
  try {
    const submissions = getSubmissions();
    res.json(submissions);
  } catch (error) {
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
 * DELETE /api/admin/submissions/:id
 * Delete a submission
 */
router.delete('/submissions/:id', (req, res) => {
  try {
    const submissions = getSubmissions();
    const filtered = submissions.filter(s => s.id !== req.params.id);
    
    if (filtered.length === submissions.length) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Save updated submissions
    fs.writeFileSync(submissionsPath, JSON.stringify(filtered, null, 2));
    
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
