/**
 * Courses Routes
 * Handles course listings, levels, and progress tracking
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const CourseModel = require('../models/Course');
const ChallengeModel = require('../models/Challenge');
const { query } = require('../database/connection');

const challengesPath = path.join(__dirname, '../data/challenges-new.json');
const progressPath = path.join(__dirname, '../data/user-progress.json');
const assignmentsPath = path.join(__dirname, '../data/user-assignments.json');
const coursesPath = path.join(__dirname, '../data/courses.json');

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

// Helper to get all courses
const getCourses = () => {
  return loadJSON(coursesPath);
};

// Helper to save courses
const saveCourses = (courses) => {
  return saveJSON(coursesPath, courses);
};

// Helper to get all challenges
const getChallenges = () => {
  return loadJSON(challengesPath);
};

// Helper to save challenges
const saveChallenges = (challenges) => {
  return saveJSON(challengesPath, challenges);
};

// Helper to get user progress
const getProgress = () => {
  return loadJSON(progressPath);
};

// Helper to save user progress
const saveProgress = (progress) => {
  return saveJSON(progressPath, progress);
};

// Helper to get user assignments
const getAssignments = () => {
  return loadJSON(assignmentsPath);
};

// Helper to save user assignments
const saveAssignments = (assignments) => {
  return saveJSON(assignmentsPath, assignments);
};

/**
 * GET /api/courses
 * Get all available courses
 */
router.get('/', async (req, res) => {
  try {
    let courses;
    try {
      courses = await CourseModel.findAll();
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      courses = loadJSON(coursesPath);
    }
    
    // Convert snake_case to camelCase for frontend
    const formattedCourses = courses.map(course => ({
      ...course,
      imageUrl: course.image_url || course.imageUrl,
      totalLevels: course.total_levels || course.totalLevels,
      totalPoints: course.total_points || course.totalPoints,
      estimatedTime: course.estimated_time || course.estimatedTime,
      createdAt: course.created_at || course.createdAt
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/:courseId
 * Get specific course details
 */
router.get('/:courseId', async (req, res) => {
  try {
    let course;
    try {
      course = await CourseModel.findById(req.params.courseId);
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      const courses = loadJSON(coursesPath);
      course = courses.find(c => c.id === req.params.courseId);
    }
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Convert snake_case to camelCase
    const formattedCourse = {
      ...course,
      imageUrl: course.image_url || course.imageUrl,
      totalLevels: course.total_levels || course.totalLevels,
      totalPoints: course.total_points || course.totalPoints,
      estimatedTime: course.estimated_time || course.estimatedTime,
      createdAt: course.created_at || course.createdAt
    };
    
    res.json(formattedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * GET /api/courses/:courseId/levels
 * Get all levels for a course
 */
router.get('/:courseId/levels', async (req, res) => {
  try {
    let challenges = [];
    
    // Try database first
    try {
      challenges = await query(
        'SELECT * FROM challenges WHERE course_id = ? ORDER BY level, id',
        [req.params.courseId]
      );
    } catch (dbError) {
      console.log('Database error, using JSON file for levels:', dbError.message);
      // Fallback to JSON file
      const allChallenges = getChallenges();
      challenges = allChallenges.filter(c => c.courseId === req.params.courseId);
    }
    
    // Group by level
    const levels = {};
    challenges.forEach(challenge => {
      const levelNum = challenge.level;
      if (!levels[levelNum]) {
        levels[levelNum] = [];
      }
      // Convert snake_case and parse JSON (handle both DB and JSON formats)
      levels[levelNum].push({
        ...challenge,
        courseId: challenge.course_id || challenge.courseId,
        timeLimit: challenge.time_limit || challenge.timeLimit,
        passingThreshold: typeof challenge.passing_threshold === 'string' 
          ? JSON.parse(challenge.passing_threshold || '{}')
          : (challenge.passingThreshold || {}),
        expectedSolution: challenge.expected_html ? {
          html: challenge.expected_html,
          css: challenge.expected_css,
          js: challenge.expected_js
        } : (challenge.expectedSolution || {}),
        expectedScreenshotUrl: challenge.expected_screenshot_url || challenge.expectedScreenshotUrl,
        createdAt: challenge.created_at || challenge.createdAt,
        updatedAt: challenge.updated_at || challenge.updatedAt,
        tags: typeof challenge.tags === 'string'
          ? JSON.parse(challenge.tags || '[]')
          : (challenge.tags || [])
      });
    });
    
    // Convert to array and sort
    const levelsArray = Object.keys(levels).map(level => ({
      level: parseInt(level),
      questions: levels[level],
      totalQuestions: levels[level].length,
      totalPoints: levels[level].reduce((sum, q) => sum + (q.points || 0), 0)
    })).sort((a, b) => a.level - b.level);
    
    res.json(levelsArray);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

/**
 * GET /api/courses/:courseId/levels/:level/questions
 * Get assigned questions for a specific level (2 random questions)
 * Query params: userId (optional, defaults to 'default-user')
 */
router.get('/:courseId/levels/:level/questions', async (req, res) => {
  try {
    const { courseId, level } = req.params;
    const userId = req.query.userId || 'default-user';
    
    // Get all questions for this level (question bank) from database
    const allQuestions = await ChallengeModel.findByCourseLevel(courseId, parseInt(level));
    
    if (allQuestions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this level' });
    }
    
    // Check if user already has assigned questions for this level
    const assignments = getAssignments();
    const assignmentKey = `${userId}-${courseId}-${level}`;
    let userAssignment = assignments.find(a => a.key === assignmentKey);
    
    if (!userAssignment) {
      // First time user accesses this level - assign 2 random questions
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(2, allQuestions.length));
      
      userAssignment = {
        key: assignmentKey,
        userId,
        courseId,
        level: parseInt(level),
        assignedQuestions: selectedQuestions.map(q => q.id),
        completedQuestions: [],
        assignedAt: new Date().toISOString(),
        totalAvailable: allQuestions.length
      };
      
      assignments.push(userAssignment);
      saveAssignments(assignments);
      
      console.log(`✅ Assigned ${selectedQuestions.length} random questions to ${userId} for ${courseId} Level ${level}`);
    }
    
    // Return only the assigned questions
    const assignedQuestions = allQuestions.filter(q => 
      userAssignment.assignedQuestions.includes(q.id)
    );
    
    // Add completion status to each question
    const questionsWithStatus = assignedQuestions.map(q => ({
      ...q,
      isCompleted: userAssignment.completedQuestions.includes(q.id)
    }));
    
    res.json(questionsWithStatus);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
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
 * Mark a question as completed and check if level is unlocked
 * Body: { questionId, courseId, level, score }
 */
router.post('/progress/:userId/complete', (req, res) => {
  try {
    const { userId } = req.params;
    const { questionId, courseId, level, score } = req.body;
    
    if (!questionId || !courseId || !level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update assignment to mark question as completed
    const assignments = getAssignments();
    const assignmentKey = `${userId}-${courseId}-${level}`;
    const assignmentIndex = assignments.findIndex(a => a.key === assignmentKey);
    
    if (assignmentIndex === -1) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const assignment = assignments[assignmentIndex];
    
    // Add to completed questions if not already there
    if (!assignment.completedQuestions.includes(questionId)) {
      assignment.completedQuestions.push(questionId);
      assignment.lastCompletedAt = new Date().toISOString();
    }
    
    // Check if level is complete (all assigned questions done)
    const levelComplete = assignment.completedQuestions.length === assignment.assignedQuestions.length;
    assignment.isLevelComplete = levelComplete;
    
    if (levelComplete) {
      assignment.completedAt = new Date().toISOString();
      console.log(`🎉 ${userId} completed ${courseId} Level ${level}!`);
    }
    
    assignments[assignmentIndex] = assignment;
    saveAssignments(assignments);
    
    // Update user progress
    const allProgress = getProgress();
    let userProgressIndex = allProgress.findIndex(p => p.userId === userId);
    
    if (userProgressIndex === -1) {
      // Create new progress entry
      allProgress.push({
        userId,
        courses: [],
        totalPoints: 0,
        achievements: []
      });
      userProgressIndex = allProgress.length - 1;
    }
    
    const userProgress = allProgress[userProgressIndex];
    
    // Find or create course progress
    let courseProgress = userProgress.courses.find(c => c.courseId === courseId);
    if (!courseProgress) {
      courseProgress = {
        courseId,
        completedLevels: [],
        currentLevel: 1,
        totalPoints: 0
      };
      userProgress.courses.push(courseProgress);
    }
    
    // Update points
    const question = getChallenges().find(q => q.id === questionId);
    const points = score || question?.points || 100;
    courseProgress.totalPoints += points;
    userProgress.totalPoints += points;
    
    // Mark level as complete and unlock next level
    if (levelComplete && !courseProgress.completedLevels.includes(parseInt(level))) {
      courseProgress.completedLevels.push(parseInt(level));
      courseProgress.currentLevel = Math.min(parseInt(level) + 1, 6); // Max 6 levels
      
      console.log(`🔓 Unlocked Level ${courseProgress.currentLevel} for ${userId}`);
    }
    
    allProgress[userProgressIndex] = userProgress;
    saveProgress(allProgress);
    
    res.json({
      message: 'Progress updated',
      levelComplete,
      nextLevelUnlocked: levelComplete,
      nextLevel: levelComplete ? Math.min(parseInt(level) + 1, 6) : parseInt(level),
      completedQuestions: assignment.completedQuestions.length,
      totalQuestions: assignment.assignedQuestions.length,
      points,
      totalPoints: courseProgress.totalPoints
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
router.get('/:courseId/questions', async (req, res) => {
  try {
    const { courseId } = req.params;
    let courseQuestions;
    
    try {
      // Query challenges from database by course_id
      const challenges = await query('SELECT * FROM challenges WHERE course_id = ? ORDER BY level, created_at', [courseId]);
      courseQuestions = challenges.map(c => ({
        id: c.id,
        title: c.title,
        courseId: c.course_id,
        level: c.level,
        difficulty: c.difficulty,
        description: c.description,
        instructions: c.instructions,
        tags: Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]'),
        timeLimit: c.time_limit,
        passingThreshold: (typeof c.passing_threshold === 'object' && c.passing_threshold !== null) 
          ? c.passing_threshold 
          : JSON.parse(c.passing_threshold || '{}'),
        points: c.points || 0,
        hints: Array.isArray(c.hints) ? c.hints : JSON.parse(c.hints || '[]'),
        expectedSolution: {
          html: c.expected_html,
          css: c.expected_css,
          js: c.expected_js
        }
      }));
    } catch (dbError) {
      console.log('Database error, using JSON file:', dbError.message);
      const challenges = getChallenges();
      courseQuestions = challenges.filter(c => c.courseId === courseId);
    }
    
    res.json(courseQuestions);
  } catch (error) {
    console.error('Error fetching course questions:', error);
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

/**
 * GET /api/courses/:courseId/levels/:level/template
 * Download question bank template for a specific level
 */
router.get('/:courseId/levels/:level/template', (req, res) => {
  const { courseId, level } = req.params;
  
  const sampleQuestions = [
    {
      id: `${courseId}-l${level}-q1`,
      courseId: courseId,
      level: parseInt(level),
      questionNumber: 1,
      title: `Level ${level} - Question 1`,
      description: "Brief description of what students need to build",
      instructions: "Detailed step-by-step instructions:\n- Step 1: Create HTML structure\n- Step 2: Apply CSS styling\n- Step 3: Add interactivity",
      assets: {
        images: [],
        reference: ""
      },
      hints: [
        "Hint 1: Use semantic HTML tags",
        "Hint 2: Apply modern CSS techniques",
        "Hint 3: Test in browser"
      ],
      tags: ["HTML", "CSS"],
      timeLimit: 20,
      points: 100,
      passingThreshold: {
        structure: 70,
        visual: 80,
        overall: 75
      },
      isLocked: false,
      prerequisite: null,
      expectedSolution: {
        html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Solution</title>\n</head>\n<body>\n  <div class=\"container\">\n    <!-- Your solution here -->\n  </div>\n</body>\n</html>",
        css: "body {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n}",
        js: "// Optional JavaScript"
      }
    },
    {
      id: `${courseId}-l${level}-q2`,
      courseId: courseId,
      level: parseInt(level),
      questionNumber: 2,
      title: `Level ${level} - Question 2`,
      description: "Another question for this level",
      instructions: "Build something based on the requirements",
      assets: {
        images: [],
        reference: ""
      },
      hints: ["Apply what you learned in Q1"],
      tags: ["HTML", "CSS"],
      timeLimit: 25,
      points: 120,
      passingThreshold: {
        structure: 70,
        visual: 80,
        overall: 75
      },
      isLocked: false,
      prerequisite: `${courseId}-l${level}-q1`,
      expectedSolution: {
        html: "<!DOCTYPE html>\n<html>\n<body>\n  <h1>Question 2</h1>\n</body>\n</html>",
        css: "h1 { color: #333; }",
        js: ""
      }
    }
  ];
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=${courseId}-level-${level}-template.json`);
  res.json(sampleQuestions);
});

/**
 * POST /api/courses/:courseId/levels/:level/questions/bulk
 * Upload question bank for a specific level
 * Body: { questions: [...], randomizeCount: 2 }
 */
router.post('/:courseId/levels/:level/questions/bulk', (req, res) => {
  try {
    const { courseId, level } = req.params;
    const { questions, randomizeCount } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array required' });
    }
    
    // Validate course exists
    const courses = getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Store randomize count in course level settings
    if (!course.levelSettings) {
      course.levelSettings = {};
    }
    if (!course.levelSettings[level]) {
      course.levelSettings[level] = {};
    }
    course.levelSettings[level].randomizeCount = randomizeCount || 2;
    
    const challenges = getChallenges();
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    questions.forEach((question, index) => {
      try {
        // Validate required fields
        if (!question.id || !question.title) {
          errors.push(`Question ${index + 1}: Missing required fields (id, title)`);
          skippedCount++;
          return;
        }
        
        // Force the level to match the URL parameter
        const questionData = {
          ...question,
          courseId: courseId,
          level: parseInt(level),
          createdAt: question.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Check if question ID already exists
        const existingIndex = challenges.findIndex(c => c.id === question.id);
        if (existingIndex !== -1) {
          // Update existing question
          challenges[existingIndex] = { ...challenges[existingIndex], ...questionData };
          updatedCount++;
        } else {
          // Add new question
          challenges.push(questionData);
          addedCount++;
        }
      } catch (err) {
        errors.push(`Question ${index + 1}: ${err.message}`);
        skippedCount++;
      }
    });
    
    // Save challenges
    if (addedCount > 0 || updatedCount > 0) {
      saveChallenges(challenges);
      
      // Save course with updated level settings
      const courseIndex = courses.findIndex(c => c.id === courseId);
      courses[courseIndex] = course;
      saveCourses(courses);
    }
    
    res.json({
      message: 'Question bank uploaded successfully',
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: questions.length,
      randomizeCount: course.levelSettings[level].randomizeCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Level bulk upload error:', error);
    res.status(500).json({ error: 'Failed to upload question bank' });
  }
});

/**
 * PUT /api/courses/:courseId/restrictions
 * Update exam restrictions for a course
 * Body: { blockCopy, blockPaste, forceFullscreen, maxViolations }
 */
router.put('/:courseId/restrictions', (req, res) => {
  try {
    const { courseId } = req.params;
    const { blockCopy, blockPaste, forceFullscreen, maxViolations, timeLimit } = req.body;
    
    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Update restrictions
    courses[courseIndex].restrictions = {
      blockCopy: blockCopy !== undefined ? blockCopy : true,
      blockPaste: blockPaste !== undefined ? blockPaste : true,
      forceFullscreen: forceFullscreen !== undefined ? forceFullscreen : true,
      maxViolations: maxViolations || 3,
      timeLimit: timeLimit !== undefined ? timeLimit : 0 // in minutes, 0 = no limit
    };
    
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    
    res.json({
      message: 'Restrictions updated successfully',
      restrictions: courses[courseIndex].restrictions
    });
  } catch (error) {
    console.error('Restrictions update error:', error);
    res.status(500).json({ error: 'Failed to update restrictions' });
  }
});

/**
 * GET /api/courses/:courseId/restrictions
 * Get exam restrictions for a course
 */
router.get('/:courseId/restrictions', (req, res) => {
  try {
    const { courseId } = req.params;
    const courses = getCourses();
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Return restrictions or defaults
    const restrictions = course.restrictions || {
      blockCopy: true,
      blockPaste: true,
      forceFullscreen: true,
      maxViolations: 3,
      timeLimit: 0
    };
    
    res.json(restrictions);
  } catch (error) {
    console.error('Get restrictions error:', error);
    res.status(500).json({ error: 'Failed to fetch restrictions' });
  }
});

/**
 * GET /api/courses/:courseId/level-settings
 * Get level settings (randomization counts, etc.)
 */
router.get('/:courseId/level-settings', (req, res) => {
  try {
    const { courseId } = req.params;
    const courses = getCourses();
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course.levelSettings || {});
  } catch (error) {
    console.error('Get level settings error:', error);
    res.status(500).json({ error: 'Failed to fetch level settings' });
  }
});

module.exports = router;

