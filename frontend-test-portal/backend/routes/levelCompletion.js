const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const progressPath = path.join(__dirname, '../data/user-progress.json');

const readProgress = () => {
  if (!fs.existsSync(progressPath)) return [];
  try {
    const raw = fs.readFileSync(progressPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read user-progress.json', err);
    return [];
  }
};

const saveProgress = (data) => {
  fs.writeFileSync(progressPath, JSON.stringify(data, null, 2));
};

/**
 * POST /api/level-completion
 * Body: { userId, courseId, level, completedAt, finalScore, passed, questionsSubmitted, questionsPassed, totalQuestions, feedback, results }
 */
router.post('/', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.userId || !payload.courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' });
    }

    const users = readProgress();
    let user = users.find(u => u.userId === payload.userId);
    if (!user) {
      user = {
        userId: payload.userId,
        courses: [],
        totalPoints: 0,
        achievements: [],
        createdAt: new Date().toISOString()
      };
      users.push(user);
    }

    let course = (user.courses || []).find(c => c.courseId === payload.courseId);
    if (!course) {
      course = {
        courseId: payload.courseId,
        completedLevels: [],
        currentLevel: 1,
        totalPoints: 0,
        completedQuestions: []
      };
      user.courses.push(course);
    }

    // Save completion info
    if (payload.passed) {
      if (!course.completedLevels) course.completedLevels = [];
      if (!course.completedLevels.includes(payload.level)) {
        course.completedLevels.push(payload.level);
      }
      // Unlock next level
      course.currentLevel = Math.max(course.currentLevel || 1, payload.level + 1);
    }

    // Update points
    course.totalPoints = (course.totalPoints || 0) + (payload.finalScore || 0);
    user.totalPoints = (user.totalPoints || 0) + (payload.finalScore || 0);

    // Append question-level details to completedQuestions
    if (!course.completedQuestions) course.completedQuestions = [];
    course.completedQuestions.push({
      level: payload.level,
      completedAt: payload.completedAt || new Date().toISOString(),
      finalScore: payload.finalScore || 0,
      passed: payload.passed || false,
      questionsSubmitted: payload.questionsSubmitted || 0,
      questionsPassed: payload.questionsPassed || 0,
      results: payload.results || [],
      feedback: payload.feedback || ''
    });

    saveProgress(users);

    res.json({ message: 'Level completion saved', course, user });
  } catch (error) {
    console.error('Error saving level completion', error);
    res.status(500).json({ error: 'Failed to save level completion' });
  }
});

module.exports = router;
