/**
 * Courses Routes
 * Handles course listings, levels, and progress tracking
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const coursesPath = path.join(__dirname, '../data/courses.json');
const challengesPath = path.join(__dirname, '../data/challenges-new.json');
const progressPath = path.join(__dirname, '../data/user-progress.json');

// Helper functions
const getCourses = () => {
  const data = fs.readFileSync(coursesPath, 'utf8');
  return JSON.parse(data);
};

const getChallenges = () => {
  const data = fs.readFileSync(challengesPath, 'utf8');
  return JSON.parse(data);
};

const getProgress = () => {
  try {
    const data = fs.readFileSync(progressPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveProgress = (progress) => {
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
};

/**
 * GET /api/courses
 * Get all available courses
 */
router.get('/', (req, res) => {
  try {
    const courses = getCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/:courseId
 * Get specific course details
 */
router.get('/:courseId', (req, res) => {
  try {
    const courses = getCourses();
    const course = courses.find(c => c.id === req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * GET /api/courses/:courseId/levels
 * Get all levels for a course
 */
router.get('/:courseId/levels', (req, res) => {
  try {
    const challenges = getChallenges();
    const courseChallenges = challenges.filter(c => c.courseId === req.params.courseId);
    
    // Group by level
    const levels = {};
    courseChallenges.forEach(challenge => {
      if (!levels[challenge.level]) {
        levels[challenge.level] = [];
      }
      levels[challenge.level].push(challenge);
    });
    
    // Convert to array and sort
    const levelsArray = Object.keys(levels).map(level => ({
      level: parseInt(level),
      questions: levels[level].sort((a, b) => a.questionNumber - b.questionNumber),
      totalQuestions: levels[level].length,
      totalPoints: levels[level].reduce((sum, q) => sum + q.points, 0)
    })).sort((a, b) => a.level - b.level);
    
    res.json(levelsArray);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

/**
 * GET /api/courses/:courseId/levels/:level/questions
 * Get all questions for a specific level
 */
router.get('/:courseId/levels/:level/questions', (req, res) => {
  try {
    const challenges = getChallenges();
    const { courseId, level } = req.params;
    
    const questions = challenges.filter(
      c => c.courseId === courseId && c.level === parseInt(level)
    ).sort((a, b) => a.questionNumber - b.questionNumber);
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this level' });
    }
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/courses/:courseId/levels/:level/questions/:questionId
 * Get specific question details
 */
router.get('/:courseId/levels/:level/questions/:questionId', (req, res) => {
  try {
    const challenges = getChallenges();
    const question = challenges.find(c => c.id === req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * GET /api/courses/progress/:userId
 * Get user's progress across all courses
 */
router.get('/progress/:userId', (req, res) => {
  try {
    const allProgress = getProgress();
    const userProgress = allProgress.find(p => p.userId === req.params.userId);
    
    if (!userProgress) {
      // Return empty progress for new user
      return res.json({
        userId: req.params.userId,
        courses: [],
        totalPoints: 0,
        achievements: []
      });
    }
    
    res.json(userProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * POST /api/courses/progress/:userId/complete
 * Mark a question as completed
 */
router.post('/progress/:userId/complete', (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId, questionId, points, level } = req.body;
    
    let allProgress = getProgress();
    let userProgress = allProgress.find(p => p.userId === userId);
    
    // Create new user progress if doesn't exist
    if (!userProgress) {
      userProgress = {
        userId,
        username: userId,
        courses: [],
        totalPoints: 0,
        achievements: [],
        createdAt: new Date().toISOString()
      };
      allProgress.push(userProgress);
    }
    
    // Find or create course progress
    let courseProgress = userProgress.courses.find(c => c.courseId === courseId);
    if (!courseProgress) {
      courseProgress = {
        courseId,
        enrolledAt: new Date().toISOString(),
        currentLevel: 1,
        completedQuestions: [],
        totalPoints: 0,
        progress: 0
      };
      userProgress.courses.push(courseProgress);
    }
    
    // Add question to completed if not already there
    if (!courseProgress.completedQuestions.includes(questionId)) {
      courseProgress.completedQuestions.push(questionId);
      courseProgress.totalPoints += points;
      userProgress.totalPoints += points;
      
      // Update current level if needed
      if (level > courseProgress.currentLevel) {
        courseProgress.currentLevel = level;
      }
      
      // Calculate progress percentage
      const challenges = getChallenges();
      const totalQuestionsInCourse = challenges.filter(c => c.courseId === courseId).length;
      courseProgress.progress = Math.round((courseProgress.completedQuestions.length / totalQuestionsInCourse) * 100);
    }
    
    // Save progress
    saveProgress(allProgress);
    
    res.json({
      message: 'Progress updated',
      progress: userProgress
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * PUT /api/courses/:courseId
 * Update a course (Admin only)
 */
router.put('/:courseId', (req, res) => {
  try {
    const { courseId } = req.params;
    const updatedCourse = req.body;
    
    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Update course while keeping the ID
    courses[courseIndex] = { ...courses[courseIndex], ...updatedCourse, id: courseId };
    
    // Save to file
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    
    res.json({
      message: 'Course updated successfully',
      course: courses[courseIndex]
    });
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * POST /api/courses
 * Create a new course (Admin only)
 */
router.post('/', (req, res) => {
  try {
    const newCourse = req.body;
    
    // Validate required fields
    if (!newCourse.id || !newCourse.title) {
      return res.status(400).json({ error: 'Course ID and title are required' });
    }
    
    const courses = getCourses();
    
    // Check if course ID already exists
    if (courses.find(c => c.id === newCourse.id)) {
      return res.status(400).json({ error: 'Course ID already exists' });
    }
    
    // Add default values
    const course = {
      totalLevels: 6,
      estimatedTime: '10 hours',
      difficulty: 'Beginner',
      tags: [],
      ...newCourse
    };
    
    courses.push(course);
    
    // Save to file
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    
    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * DELETE /api/courses/:courseId
 * Delete a course (Admin only)
 */
router.delete('/:courseId', (req, res) => {
  try {
    const { courseId } = req.params;
    
    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const deletedCourse = courses[courseIndex];
    courses.splice(courseIndex, 1);
    
    // Save to file
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    
    res.json({
      message: 'Course deleted successfully',
      course: deletedCourse
    });
  } catch (error) {
    console.error('Course deletion error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * GET /api/courses/:courseId/questions
 * Get all questions for a specific course (Admin view)
 */
router.get('/:courseId/questions', (req, res) => {
  try {
    const { courseId } = req.params;
    const challenges = getChallenges();
    const courseQuestions = challenges.filter(c => c.courseId === courseId);
    
    res.json(courseQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * PUT /api/courses/questions/:questionId
 * Update a question (Admin only)
 */
router.put('/questions/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    const updatedQuestion = req.body;
    
    const challenges = getChallenges();
    const questionIndex = challenges.findIndex(c => c.id === questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Update question while keeping the ID
    challenges[questionIndex] = { ...challenges[questionIndex], ...updatedQuestion, id: questionId };
    
    // Save to file
    fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
    
    res.json({
      message: 'Question updated successfully',
      question: challenges[questionIndex]
    });
  } catch (error) {
    console.error('Question update error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * POST /api/courses/:courseId/questions
 * Create a new question for a course (Admin only)
 */
router.post('/:courseId/questions', (req, res) => {
  try {
    const { courseId } = req.params;
    const newQuestion = req.body;
    
    // Validate required fields
    if (!newQuestion.id || !newQuestion.title || !newQuestion.level) {
      return res.status(400).json({ error: 'Question ID, title, and level are required' });
    }
    
    const challenges = getChallenges();
    
    // Check if question ID already exists
    if (challenges.find(c => c.id === newQuestion.id)) {
      return res.status(400).json({ error: 'Question ID already exists' });
    }
    
    // Add default values
    const question = {
      courseId,
      questionNumber: 1,
      points: 100,
      isLocked: false,
      hints: [],
      assets: { images: [], reference: '' },
      ...newQuestion
    };
    
    challenges.push(question);
    
    // Save to file
    fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
    
    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Question creation error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * DELETE /api/courses/questions/:questionId
 * Delete a question (Admin only)
 */
router.delete('/questions/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    
    const challenges = getChallenges();
    const questionIndex = challenges.findIndex(c => c.id === questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const deletedQuestion = challenges[questionIndex];
    challenges.splice(questionIndex, 1);
    
    // Save to file
    fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
    
    res.json({
      message: 'Question deleted successfully',
      question: deletedQuestion
    });
  } catch (error) {
    console.error('Question deletion error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

/**
 * POST /api/courses/:courseId/questions/bulk
 * Bulk upload questions from JSON
 * Body: { questions: [...] }
 */
router.post('/:courseId/questions/bulk', (req, res) => {
  try {
    const { courseId } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array required' });
    }
    
    // Validate course exists
    const courses = getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const challenges = getChallenges();
    let addedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    questions.forEach((question, index) => {
      try {
        // Validate required fields
        if (!question.id || !question.title || !question.level) {
          errors.push(`Question ${index + 1}: Missing required fields (id, title, level)`);
          skippedCount++;
          return;
        }
        
        // Check if question ID already exists
        if (challenges.find(c => c.id === question.id)) {
          errors.push(`Question ${index + 1}: ID "${question.id}" already exists`);
          skippedCount++;
          return;
        }
        
        // Add courseId if not present
        const newQuestion = {
          ...question,
          courseId: courseId,
          createdAt: question.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        challenges.push(newQuestion);
        addedCount++;
      } catch (err) {
        errors.push(`Question ${index + 1}: ${err.message}`);
        skippedCount++;
      }
    });
    
    // Save to file
    if (addedCount > 0) {
      fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
    }
    
    res.json({
      message: 'Bulk upload completed',
      added: addedCount,
      skipped: skippedCount,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to upload questions' });
  }
});

/**
 * GET /api/courses/:courseId/levels/:level/randomize
 * Get random questions for a level (question bank feature)
 * Query params: count (default: 2)
 */
router.get('/:courseId/levels/:level/randomize', (req, res) => {
  try {
    const { courseId, level } = req.params;
    const count = parseInt(req.query.count) || 2;
    
    const challenges = getChallenges();
    const levelQuestions = challenges.filter(
      c => c.courseId === courseId && c.level === parseInt(level)
    );
    
    if (levelQuestions.length === 0) {
      return res.json([]);
    }
    
    // Shuffle and pick random questions
    const shuffled = [...levelQuestions].sort(() => 0.5 - Math.random());
    const randomQuestions = shuffled.slice(0, Math.min(count, levelQuestions.length));
    
    res.json({
      questions: randomQuestions,
      totalAvailable: levelQuestions.length,
      selected: randomQuestions.length
    });
  } catch (error) {
    console.error('Randomize error:', error);
    res.status(500).json({ error: 'Failed to randomize questions' });
  }
});

/**
 * GET /api/courses/sample/json
 * Download sample JSON template for bulk upload
 */
router.get('/sample/json', (req, res) => {
  const sampleQuestions = [
    {
      id: "course-id-l1-q1",
      courseId: "course-html-css",
      level: 1,
      questionNumber: 1,
      title: "Sample Question Title",
      description: "Brief description of what students need to build",
      instructions: "Detailed step-by-step instructions:\n- Step 1\n- Step 2\n- Step 3",
      assets: {
        images: [
          {
            name: "sample-image.png",
            path: "/assets/images/sample-image.png",
            description: "Description of the image"
          }
        ],
        reference: "/assets/references/course-id-l1-q1-ref.png"
      },
      hints: [
        "Hint 1: Use semantic HTML",
        "Hint 2: Apply CSS flexbox",
        "Hint 3: Add hover effects"
      ],
      tags: ["HTML", "CSS", "Flexbox"],
      timeLimit: 15,
      points: 100,
      passingThreshold: {
        structure: 70,
        visual: 80,
        overall: 75
      },
      isLocked: false,
      prerequisite: null,
      expectedSolution: {
        html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Sample</title>\n</head>\n<body>\n  <div class=\"container\">Sample content</div>\n</body>\n</html>",
        css: "body {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n}",
        js: "// Optional JavaScript code"
      }
    },
    {
      id: "course-id-l1-q2",
      courseId: "course-html-css",
      level: 1,
      questionNumber: 2,
      title: "Another Sample Question",
      description: "Second example",
      instructions: "Build something similar to the first question",
      assets: {
        images: [],
        reference: ""
      },
      hints: ["Use what you learned in Q1"],
      tags: ["HTML", "CSS"],
      timeLimit: 20,
      points: 150,
      passingThreshold: {
        structure: 70,
        visual: 80,
        overall: 75
      },
      isLocked: false,
      prerequisite: "course-id-l1-q1",
      expectedSolution: {
        html: "<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>",
        css: "h1 { color: blue; }",
        js: ""
      }
    }
  ];
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=sample-questions.json');
  res.json(sampleQuestions);
});

/**
 * GET /api/courses/sample/csv
 * Download sample CSV template for bulk upload
 */
router.get('/sample/csv', (req, res) => {
  const csvContent = `id,courseId,level,questionNumber,title,description,instructions,timeLimit,points,tags,hints
course-id-l1-q1,course-html-css,1,1,"Sample Question","Brief description","Detailed instructions here",15,100,"HTML,CSS","Hint 1|Hint 2|Hint 3"
course-id-l1-q2,course-html-css,1,2,"Another Question","Second example","Build something similar",20,150,"HTML,CSS,Flexbox","Use what you learned in Q1"
course-id-l2-q1,course-html-css,2,1,"Level 2 Question","More advanced","Complex instructions",30,200,"HTML,CSS,JavaScript","Hint 1|Hint 2"

Note: This CSV format is simplified. For complex questions with assets and expected solutions use JSON format.
For expectedSolution HTML/CSS/JS use the JSON format or add them via the web interface after CSV import.`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sample-questions.csv');
  res.send(csvContent);
});

module.exports = router;

