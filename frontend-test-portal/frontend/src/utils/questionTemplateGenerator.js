export function generateQuestionTemplate({
  courseId,
  level,
  questionNumber,
  title,
  description,
  instructions,
  assets = {},
  hints = [],
  tags = [],
  timeLimit = 20,
  points = 100,
  passingThreshold = { structure: 70, visual: 80, overall: 75 },
  isLocked = false,
  prerequisite = null,
  expectedSolution = { html: '', css: '', js: '' }
}) {
  if (!courseId || !level || !questionNumber) {
    throw new Error('courseId, level, and questionNumber are required');
  }

  return {
    id: `${courseId}-l${level}-q${questionNumber}`,
    courseId,
    level,
    questionNumber,
    title: title || `Level ${level} - Question ${questionNumber}`,
    description: description || 'Brief description of what students need to build',
    instructions:
      instructions ||
      'Detailed step-by-step instructions:\n- Step 1: Outline the HTML structure\n- Step 2: Apply CSS styling\n- Step 3: Add optional enhancements',
    assets: {
      images: assets.images || [],
      reference: assets.reference || ''
    },
    hints: hints.length ? hints : ['Hint 1: Use semantic HTML tags'],
    tags: tags.length ? tags : ['HTML', 'CSS'],
    timeLimit,
    points,
    passingThreshold: {
      structure: passingThreshold.structure ?? 70,
      visual: passingThreshold.visual ?? 80,
      overall: passingThreshold.overall ?? 75
    },
    isLocked,
    prerequisite,
    expectedSolution: {
      html:
        expectedSolution.html ||
        '<!DOCTYPE html>\n<html>\n<head>\n  <title>Solution</title>\n</head>\n<body>\n  <div class="container">\n    <!-- Your solution here -->\n  </div>\n</body>\n</html>',
      css:
        expectedSolution.css ||
        'body {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n}',
      js: expectedSolution.js || '// Optional JavaScript'
    }
  };
}

export function generateLevelTemplate({ courseId, level, totalQuestions = 2, baseConfig = {} }) {
  const questions = [];
  for (let q = 1; q <= totalQuestions; q++) {
    questions.push(
      generateQuestionTemplate({
        courseId,
        level,
        questionNumber: q,
        ...baseConfig,
        title: baseConfig.title ? `${baseConfig.title} ${q}` : undefined,
        prerequisite: q === 1 ? null : `${courseId}-l${level}-q${q - 1}`
      })
    );
  }
  return questions;
}

export function exampleLevelTemplate() {
  return generateLevelTemplate({
    courseId: 'course-html-css',
    level: 1,
    totalQuestions: 2,
    baseConfig: {
      description: 'Brief description of what students need to build',
      hints: ['Hint 1: Use semantic HTML tags', 'Hint 2: Apply modern CSS techniques'],
      assets: { images: [], reference: '' }
    }
  });
}
