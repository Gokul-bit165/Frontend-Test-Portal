/**
 * Evaluation Routes
 * Triggers hybrid evaluation (DOM + Pixel Matching)
 */

const express = require('express');
const router = express.Router();
const evaluator = require('../services/evaluator');
const fs = require('fs');
const path = require('path');

const submissionsPath = path.join(__dirname, '../data/submissions.json');
const challengesPath = path.join(__dirname, '../data/challenges.json');
const challengesNewPath = path.join(__dirname, '../data/challenges-new.json');

// Helper functions
const getSubmissions = () => {
  const data = fs.readFileSync(submissionsPath, 'utf8');
  return JSON.parse(data);
};

const saveSubmissions = (submissions) => {
  fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
};

const getChallenges = () => {
  const data = fs.readFileSync(challengesPath, 'utf8');
  return JSON.parse(data);
};

// Get challenge from either old or new format
const getChallenge = (challengeId) => {
  try {
    // Try old format first
    const oldChallenges = getChallenges();
    let challenge = oldChallenges.find(c => c.id === challengeId);
    
    if (challenge) {
      console.log(`📄 Found challenge in old format: ${challengeId}`);
      return challenge;
    }
    
    // If not found, try new format
    if (fs.existsSync(challengesNewPath)) {
      const newData = fs.readFileSync(challengesNewPath, 'utf8');
      const newChallenges = JSON.parse(newData);
      challenge = newChallenges.find(c => c.id === challengeId);
      
      if (challenge) {
        console.log(`📄 Found challenge in new format: ${challengeId}`);
        return challenge;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading challenge:', error);
    return null;
  }
};

/**
 * POST /api/evaluate
 * Evaluate a submission using hybrid method
 * Body: { submissionId }
 */
router.post('/', async (req, res) => {
  try {
    const { submissionId } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ error: 'Submission ID required' });
    }
    
    // Get submission
    const submissions = getSubmissions();
    const submission = submissions.find(s => s.id === submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Get challenge with expected solution
    const challenge = getChallenge(submission.challengeId);
    
    if (!challenge) {
      console.error(`❌ Challenge not found: ${submission.challengeId}`);
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    console.log(`\n🔄 Starting evaluation for submission: ${submissionId}`);
    console.log(`📝 Challenge: ${challenge.title}`);
    
    // Run hybrid evaluation
    const evaluationResult = await evaluator.evaluate(
      submission.code,
      challenge.expectedSolution,
      challenge.passingThreshold,
      submissionId
    );
    
    // Update submission with result
    submission.status = evaluationResult.passed ? 'passed' : 'failed';
    submission.result = evaluationResult;
    submission.evaluatedAt = new Date().toISOString();
    
    // Save updated submission
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    submissions[submissionIndex] = submission;
    saveSubmissions(submissions);
    
    console.log(`✅ Evaluation complete: ${evaluationResult.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Structure: ${evaluationResult.structureScore}%`);
    console.log(`   Visual: ${evaluationResult.visualScore}%`);
    console.log(`   Final: ${evaluationResult.finalScore}%\n`);
    
    res.json({
      message: 'Evaluation complete',
      result: evaluationResult
    });
    
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ 
      error: 'Evaluation failed', 
      details: error.message 
    });
  }
});

/**
 * POST /api/evaluate/quick
 * Quick evaluation without saving submission (for testing)
 * Body: { code: { html, css, js }, challengeId }
 */
router.post('/quick', async (req, res) => {
  try {
    const { code, challengeId } = req.body;
    
    if (!code || !challengeId) {
      return res.status(400).json({ error: 'Code and challenge ID required' });
    }
    
    // Get challenge
    const challenge = getChallenge(challengeId);
    
    if (!challenge) {
      console.error(`❌ Challenge not found: ${challengeId}`);
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Run evaluation
    const evaluationResult = await evaluator.evaluate(
      code,
      challenge.expectedSolution,
      challenge.passingThreshold,
      'quick-test'
    );
    
    res.json(evaluationResult);
    
  } catch (error) {
    console.error('Quick evaluation error:', error);
    res.status(500).json({ 
      error: 'Evaluation failed', 
      details: error.message 
    });
  }
});

module.exports = router;
