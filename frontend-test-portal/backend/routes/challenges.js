/**
 * Challenges Routes
 * Handles challenge retrieval for candidates
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const challengesPath = path.join(__dirname, '../data/challenges.json');

// Helper function to read challenges
const getChallenges = () => {
  const data = fs.readFileSync(challengesPath, 'utf8');
  return JSON.parse(data);
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
 * Get specific challenge by ID
 */
router.get('/:id', (req, res) => {
  try {
    const challenges = getChallenges();
    const challenge = challenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Return without expected solution
    const publicChallenge = {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      description: challenge.description,
      instructions: challenge.instructions,
      tags: challenge.tags,
      timeLimit: challenge.timeLimit,
      passingThreshold: challenge.passingThreshold
    };
    
    res.json(publicChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

/**
 * GET /api/challenges/:id/solution (Internal use only for evaluation)
 * Get challenge with expected solution
 */
router.get('/:id/solution', (req, res) => {
  try {
    const challenges = getChallenges();
    const challenge = challenges.find(c => c.id === req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenge solution' });
  }
});

module.exports = router;
