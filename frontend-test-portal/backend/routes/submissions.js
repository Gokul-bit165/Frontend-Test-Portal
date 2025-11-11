/**
 * Submissions Routes
 * Handles candidate code submissions
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SubmissionModel = require('../models/Submission');
const { query } = require('../database/connection');

const submissionsPath = path.join(__dirname, '../data/submissions.json');

// Helper to load JSON files
const loadJSON = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return [];
  }
};

// Helper to save JSON files
const saveJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    return false;
  }
};

// Helper to get all submissions
const getSubmissions = () => {
  return loadJSON(submissionsPath);
};

// Helper to save submissions
const saveSubmissions = (submissions) => {
  return saveJSON(submissionsPath, submissions);
};

/**
 * POST /api/submissions
 * Submit candidate solution
 * Body: { challengeId, candidateName, code: { html, css, js } }
 */
router.post('/', async (req, res) => {
  try {
    const { challengeId, candidateName, code } = req.body;
    
    if (!challengeId || !code || !code.html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const submissions = getSubmissions();
    
    const submission = {
      id: uuidv4(),
      challengeId,
      candidateName: candidateName || 'Anonymous',
      code: {
        html: code.html,
        css: code.css || '',
        js: code.js || ''
      },
      status: 'pending',
      submittedAt: new Date().toISOString(),
      evaluatedAt: null,
      result: null
    };
    
    submissions.push(submission);
    saveSubmissions(submissions);
    
    res.status(201).json({
      message: 'Submission received',
      submissionId: submission.id,
      submission
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

/**
 * GET /api/submissions/:id
 * Get specific submission
 */
router.get('/:id', (req, res) => {
  try {
    const submissions = getSubmissions();
    const submission = submissions.find(s => s.id === req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

/**
 * GET /api/submissions/:id/result
 * Get evaluation result for a submission
 */
router.get('/:id/result', (req, res) => {
  try {
    const submissions = getSubmissions();
    const submission = submissions.find(s => s.id === req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (submission.status === 'pending') {
      return res.json({
        status: 'pending',
        message: 'Evaluation in progress'
      });
    }
    
    res.json({
      status: submission.status,
      result: submission.result,
      evaluatedAt: submission.evaluatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

/**
 * GET /api/submissions
 * Get all submissions (for admin)
 */
router.get('/', (req, res) => {
  try {
    const submissions = getSubmissions();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * DELETE /api/submissions/:id
 * Delete a submission (for admin)
 */
router.delete('/:id', (req, res) => {
  try {
    const submissions = getSubmissions();
    const index = submissions.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    submissions.splice(index, 1);
    saveSubmissions(submissions);
    
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;
