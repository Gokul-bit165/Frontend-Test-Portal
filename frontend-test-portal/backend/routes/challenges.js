/**
 * Challenges Routes
 * Handles challenge retrieval for candidates
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ChallengeModel = require('../models/Challenge');
const { query } = require('../database/connection');

const challengesPath = path.join(__dirname, '../data/challenges-new.json');
const assignmentsPath = path.join(__dirname, '../data/user-assignments.json');

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

// Helper to get all challenges
const getAllChallenges = () => {
  return loadJSON(challengesPath);
};

// Helper to get assignments
const getAssignments = () => {
  return loadJSON(assignmentsPath);
};

// Helper to save assignments
const saveAssignments = (assignments) => {
  return saveJSON(assignmentsPath, assignments);
};

/**
 * GET /api/challenges
 * Get all challenges (without solutions for candidates)
 */
router.get('/', async (req, res) => {
  try {
    let challenges;
    try {
      challenges = await ChallengeModel.findAll();
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      challenges = loadJSON(challengesPath);
    }
    
    // Remove expected solutions for candidate view
    const publicChallenges = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      description: challenge.description,
      instructions: challenge.instructions,
      tags: challenge.tags || [],
      timeLimit: challenge.timeLimit || challenge.time_limit,
      passingThreshold: challenge.passingThreshold || {},
      courseId: challenge.courseId || challenge.course_id,
      level: challenge.level
    }));
    
    res.json(publicChallenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

/**
 * GET /api/challenges/level-questions
 * Get assigned questions for a user's level with random assignment
 */
router.get('/level-questions', async (req, res) => {
  try {
    const { userId, courseId, level, forceNew } = req.query;
    
    if (!userId || !courseId || !level) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Read user assignments
    let assignments = getAssignments();

    // Check if user already has assigned questions for this level
    const assignmentKey = `${userId}-${courseId}-${level}`;
    let userAssignment = assignments.find(a => a.key === assignmentKey);

    // Get all questions for this course and level from database
    let levelQuestions;
    try {
      levelQuestions = await ChallengeModel.findByCourseLevel(courseId, parseInt(level));
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      const allChallenges = getAllChallenges();
      levelQuestions = allChallenges.filter(c => 
        c.courseId === courseId && c.level === parseInt(level)
      );
    }

    // Ensure we never assign the same challenge twice
    const uniqueLevelQuestions = [];
    const seenIds = new Set();
    for (const question of levelQuestions) {
      if (question?.id && !seenIds.has(question.id)) {
        seenIds.add(question.id);
        uniqueLevelQuestions.push(question);
      }
    }

    if (uniqueLevelQuestions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this level' });
    }

    // If forceNew=true or no assignment exists, create a new random assignment
    if (forceNew === 'true' || !userAssignment) {
      // Select 2 random questions (or all if less than 2)
      const shuffled = [...uniqueLevelQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(2, shuffled.length));
      
      // Remove old assignment if it exists and forceNew is true
      if (forceNew === 'true' && userAssignment) {
        assignments = assignments.filter(a => a.key !== assignmentKey);
      }
      
      userAssignment = {
        key: assignmentKey,
        userId,
        courseId,
        level: parseInt(level),
        assignedQuestions: selectedQuestions.map(q => q.id),
        completedQuestions: [],
        assignedAt: new Date().toISOString(),
        totalAvailable: levelQuestions.length
      };
      
      // Add or update assignment
      if (forceNew === 'true') {
        assignments.push(userAssignment);
      } else {
        assignments.push(userAssignment);
      }
      saveAssignments(assignments);
    }

    // Get the full question details for assigned questions
    const assignedFullQuestions = userAssignment.assignedQuestions.map(qId => {
      const question = levelQuestions.find(c => c.id === qId);
      return question ? {
        id: question.id,
        title: question.title,
        description: question.description,
        points: question.points || 0,
        level: question.level
      } : null;
    }).filter(q => q !== null);

    res.json({
      assignedQuestions: assignedFullQuestions,
      totalAssigned: assignedFullQuestions.length,
      completedQuestions: userAssignment.completedQuestions || [],
      isLevelComplete: userAssignment.isLevelComplete || false
    });

  } catch (error) {
    console.error('Error getting level questions:', error);
    res.status(500).json({ error: 'Failed to get level questions' });
  }
});

/**
 * GET /api/challenges/:id
 * Get specific challenge by ID (supports both old and new format)
 */
router.get('/:id', async (req, res) => {
  try {
    let challenge;
    try {
      challenge = await ChallengeModel.findById(req.params.id);
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      const allChallenges = getAllChallenges();
      challenge = allChallenges.find(c => c.id === req.params.id);
    }
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Return full challenge including expected solution (for candidate view and preview)
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

/**
 * GET /api/challenges/:id/solution (Internal use only for evaluation)
 * Get challenge with expected solution (supports both old and new format)
 */
router.get('/:id/solution', (req, res) => {
  try {
    const allChallenges = getAllChallenges();
    const challenge = allChallenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenge solution' });
  }
});

/**
 * POST /api/challenges
 * Create a new challenge (Admin only)
 */
router.post('/', (req, res) => {
  try {
    const challenges = getChallenges();
    const newChallenge = {
      id: `challenge-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    challenges.push(newChallenge);
    saveChallenges(challenges);
    
    res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

/**
 * PUT /api/challenges/:id
 * Update an existing challenge (Admin only)
 */
router.put('/:id', (req, res) => {
  try {
    const challenges = getChallenges();
    const index = challenges.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    challenges[index] = {
      ...challenges[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    saveChallenges(challenges);
    res.json(challenges[index]);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

/**
 * DELETE /api/challenges/:id
 * Delete a challenge (Admin only)
 */
router.delete('/:id', (req, res) => {
  try {
    const challenges = getChallenges();
    const index = challenges.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    challenges.splice(index, 1);
    saveChallenges(challenges);
    
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

module.exports = router;
