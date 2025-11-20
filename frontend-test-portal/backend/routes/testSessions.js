const express = require('express');
const router = express.Router();
const TestSession = require('../models/TestSession');

// Create a new test session
router.post('/', async (req, res) => {
  try {
    const { user_id, course_id, level } = req.body;

    if (!user_id || !course_id || level === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, course_id, level'
      });
    }

    const session = await TestSession.create({
      user_id,
      course_id,
      level
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get test session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching test session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get test session with all submission details
router.get('/:id/details', async (req, res) => {
  try {
    const sessionWithSubmissions = await TestSession.getSessionWithSubmissions(req.params.id);
    
    if (!sessionWithSubmissions) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    res.json(sessionWithSubmissions);
  } catch (error) {
    console.error('Error fetching test session details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a submission to test session
router.post('/:id/submissions', async (req, res) => {
  try {
    const { submission_id } = req.body;

    if (!submission_id) {
      return res.status(400).json({ error: 'Missing submission_id' });
    }

    const session = await TestSession.addSubmission(req.params.id, submission_id);
    res.json(session);
  } catch (error) {
    console.error('Error adding submission to session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete test session and calculate results
router.put('/:id/complete', async (req, res) => {
  try {
    const { user_feedback } = req.body;

    const session = await TestSession.complete(req.params.id, {
      user_feedback
    });

    res.json(session);
  } catch (error) {
    console.error('Error completing test session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's test sessions
router.get('/user/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sessions = await TestSession.findByUser(req.params.userId, limit);
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching user test sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
