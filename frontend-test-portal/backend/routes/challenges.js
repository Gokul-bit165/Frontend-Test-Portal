/**
 * Challenges Routes
 * Handles challenge retrieval for candidates
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const challengesPath = path.join(__dirname, '../data/challenges.json');
const newChallengesPath = path.join(__dirname, '../data/challenges-new.json');

// Helper function to read old challenges
const getChallenges = () => {
  const data = fs.readFileSync(challengesPath, 'utf8');
  return JSON.parse(data);
};

// Helper function to read new challenges
const getNewChallenges = () => {
  try {
    const data = fs.readFileSync(newChallengesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to get all challenges (both old and new)
const getAllChallenges = () => {
  const oldChallenges = getChallenges();
  const newChallenges = getNewChallenges();
  return [...oldChallenges, ...newChallenges];
};

// Helper function to write challenges
const saveChallenges = (challenges) => {
  fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
};

/**
 * GET /api/challenges
 * Get all challenges (without solutions for candidates)
 */
router.get('/', (req, res) => {
  try {
    const challenges = getChallenges();
    
    // Remove expected solutions for candidate view
    const publicChallenges = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      description: challenge.description,
      instructions: challenge.instructions,
      tags: challenge.tags,
      timeLimit: challenge.timeLimit,
      passingThreshold: challenge.passingThreshold
    }));
    
    res.json(publicChallenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

/**
 * GET /api/challenges/:id
 * Get specific challenge by ID (supports both old and new format)
 */
router.get('/:id', (req, res) => {
  try {
    const allChallenges = getAllChallenges();
    const challenge = allChallenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Check if it's a new format challenge (course-based)
    if (challenge.courseId) {
      // New format - return with assets
      const publicChallenge = {
        id: challenge.id,
        title: challenge.title,
        courseId: challenge.courseId,
        level: challenge.level,
        questionNumber: challenge.questionNumber,
        description: challenge.description,
        instructions: challenge.instructions || challenge.description,
        points: challenge.points,
        hints: challenge.hints,
        assets: challenge.assets,
        tags: challenge.tags || [],
        timeLimit: challenge.timeLimit || 60,
        passingThreshold: challenge.passingThreshold || 80,
        expectedSolution: challenge.expectedSolution
      };
      return res.json(publicChallenge);
    }
    
    // Old format - return as before
    const publicChallenge = {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      description: challenge.description,
      instructions: challenge.instructions,
      tags: challenge.tags,
      timeLimit: challenge.timeLimit,
      passingThreshold: challenge.passingThreshold,
      expectedSolution: challenge.expectedSolution
    };
    
    res.json(publicChallenge);
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

module.exports = router;
