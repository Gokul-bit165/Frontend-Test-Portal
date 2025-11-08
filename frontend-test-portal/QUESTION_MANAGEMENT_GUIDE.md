# Question Management Guide

## Overview
This guide explains how to navigate between questions, manage questions in the admin panel, and perform bulk operations.

---

## 🔄 Question Navigation (Student View)

### Automatic Navigation
When viewing a challenge, students can now navigate between questions in the same level:

- **Previous/Next Buttons**: Appear in the challenge header when multiple questions exist
- **Question Counter**: Shows "Question X of Y" in the header
- **Keyboard Shortcuts**: (Future enhancement)

### How It Works
1. Navigate to any course → select a level → click on a question
2. If the level has multiple questions, navigation buttons appear
3. Click "Previous" or "Next" to move between questions
4. Code is NOT saved when navigating (submit before switching)

---

## 🎯 Admin Question Management

### Access Admin Panel
1. Go to `/admin` or click "Admin Login" from home
2. Login with admin credentials
3. Click on "Manage Courses"

### Managing Questions

#### **View All Questions**
```
Admin Dashboard → Course Manager → "Manage Questions" button
```
- Shows all questions grouped by level
- Filter by level (1-6) or view all
- Displays: ID, title, description, points, assets, hints, lock status

#### **Add New Question**
1. Click **"+ Add Question"** button
2. Fill in the form:
   - **Question ID**: Unique identifier (e.g., `html-css-l1-q3`)
   - **Title**: Question name
   - **Description**: Brief summary
   - **Instructions**: Detailed step-by-step guide
   - **Level**: 1-6
   - **Question Number**: Order within level
   - **Time Limit**: Minutes allowed
   - **Points**: Score value
   - **Tags**: Comma-separated (HTML, CSS, etc.)
   - **Hints**: One per line
   - **Lock Status**: Whether question is initially locked
   - **Expected Solution**: HTML, CSS, and JavaScript code
3. Click **"Add Question"**

#### **Edit Existing Question**
1. Find the question in the list
2. Click **"✏️ Edit"** button
3. Modify any fields
4. Click **"Save Changes"**

**Note**: Question ID cannot be changed after creation

#### **Delete Question**
1. Find the question in the list
2. Click **"🗑️ Delete"** button
3. Confirm deletion
4. Question is removed from `challenges-new.json`

---

## 📦 Bulk Upload Questions

### JSON Format Upload

#### Step 1: Download Sample Template
```
Admin → Manage Questions → Click "📦 Bulk Upload"
→ Click "⬇️ Download JSON Template"
```

#### Step 2: Edit the Template
The template provides the complete structure:

```json
[
  {
    "id": "course-id-l1-q1",
    "courseId": "course-html-css",
    "level": 1,
    "questionNumber": 1,
    "title": "Sample Question Title",
    "description": "Brief description",
    "instructions": "Detailed instructions:\n- Step 1\n- Step 2",
    "assets": {
      "images": [
        {
          "name": "sample-image.png",
          "path": "/assets/images/sample-image.png",
          "description": "Image description"
        }
      ],
      "reference": "/assets/references/ref.png"
    },
    "hints": [
      "Hint 1",
      "Hint 2"
    ],
    "tags": ["HTML", "CSS"],
    "timeLimit": 15,
    "points": 100,
    "passingThreshold": {
      "structure": 70,
      "visual": 80,
      "overall": 75
    },
    "isLocked": false,
    "prerequisite": null,
    "expectedSolution": {
      "html": "<!DOCTYPE html>...",
      "css": "body { ... }",
      "js": "// Optional"
    }
  }
]
```

#### Step 3: Upload
1. Copy your edited JSON array
2. Paste into the bulk upload text area
3. Click **"📦 Upload Questions"**
4. Review the results:
   - **Added**: Successfully imported questions
   - **Skipped**: Duplicates or invalid entries
   - **Errors**: Specific error messages

### CSV Format (Simplified)

#### Download CSV Template
```
Admin → Manage Questions → Click "⬇️ Download Sample CSV"
```

**CSV Structure:**
```csv
id,courseId,level,questionNumber,title,description,instructions,timeLimit,points,tags,hints
course-id-l1-q1,course-html-css,1,1,"Question Title","Description","Instructions",15,100,"HTML,CSS","Hint 1|Hint 2"
```

**Note**: CSV format is simplified. For complex questions with assets and expected solutions, use JSON format.

---

## 🎲 Question Randomization

### Purpose
Select random questions from a question bank for each level, ensuring variety.

### API Endpoint
```
GET /api/courses/:courseId/levels/:level/randomize?count=2
```

### Example Usage

#### Backend (Node.js/Express)
```javascript
const response = await fetch(
  'http://localhost:5000/api/courses/course-html-css/levels/1/randomize?count=2'
);
const data = await response.json();
console.log(data.questions); // Array of 2 random questions
```

#### Frontend (React)
```javascript
import { getRandomQuestions } from '../services/api';

const randomQuestions = await getRandomQuestions('course-html-css', 1, 2);
console.log(randomQuestions.data.questions);
```

### Response Format
```json
{
  "questions": [
    { "id": "html-css-l1-q3", "title": "..." },
    { "id": "html-css-l1-q5", "title": "..." }
  ],
  "totalAvailable": 8,
  "selected": 2
}
```

### Use Cases
1. **Student Tests**: Each student gets different questions
2. **Practice Mode**: Random questions for practice
3. **Retakes**: Different questions on second attempt

---

## 📥 Download Sample Files

### Sample JSON Template
```
GET /api/courses/sample/json
```
- **Browser**: `http://localhost:5000/api/courses/sample/json`
- **Downloads**: `sample-questions.json`
- **Contains**: 2 complete example questions with all fields

### Sample CSV Template
```
GET /api/courses/sample/csv
```
- **Browser**: `http://localhost:5000/api/courses/sample/csv`
- **Downloads**: `sample-questions.csv`
- **Contains**: Simplified CSV format with instructions

---

## 🗂️ Question Structure Reference

### Required Fields
- `id` - Unique identifier (string)
- `courseId` - Parent course ID (string)
- `level` - Level number 1-6 (number)
- `title` - Question name (string)
- `instructions` - What to build (string)

### Optional Fields
- `description` - Brief summary
- `questionNumber` - Order within level (default: 1)
- `timeLimit` - Minutes (default: 15)
- `points` - Score value (default: 100)
- `tags` - Array of strings
- `hints` - Array of hint strings
- `isLocked` - Boolean (default: false)
- `prerequisite` - Question ID that must be completed first
- `assets` - Images and reference files
- `expectedSolution` - HTML, CSS, JS code for evaluation

### Asset Structure
```json
"assets": {
  "images": [
    {
      "name": "filename.png",
      "path": "/assets/images/filename.png",
      "description": "What the image is"
    }
  ],
  "reference": "/assets/references/expected-output.png"
}
```

---

## 🔐 Question Bank Strategy

### Recommended Setup

#### Level 1-2 (Beginner)
- **Bank Size**: 10-15 questions per level
- **Randomize**: 2 questions per student
- **Purpose**: Basic concepts, variety in practice

#### Level 3-4 (Intermediate)
- **Bank Size**: 8-12 questions per level
- **Randomize**: 2 questions per student
- **Purpose**: Core skills, prevent cheating

#### Level 5-6 (Advanced)
- **Bank Size**: 6-10 questions per level
- **Randomize**: 2 questions per student
- **Purpose**: Advanced challenges, project-like

### Implementation Pattern

```javascript
// When student starts a level
async function assignLevelQuestions(userId, courseId, level) {
  // Get 2 random questions
  const response = await getRandomQuestions(courseId, level, 2);
  const questions = response.data.questions;
  
  // Store assignment in database
  await saveUserLevelAssignment({
    userId,
    courseId,
    level,
    assignedQuestions: questions.map(q => q.id)
  });
  
  return questions;
}

// When student returns to level
async function getLevelQuestions(userId, courseId, level) {
  // Check if already assigned
  const assignment = await getUserLevelAssignment(userId, courseId, level);
  
  if (assignment) {
    // Return previously assigned questions
    return assignment.assignedQuestions;
  } else {
    // Assign new random questions
    return await assignLevelQuestions(userId, courseId, level);
  }
}
```

---

## 🛠️ Best Practices

### Question Creation
1. **Unique IDs**: Use format `{courseId}-l{level}-q{number}`
2. **Clear Instructions**: Step-by-step, numbered lists
3. **Appropriate Assets**: Provide all needed images
4. **Realistic Time**: Test questions yourself first
5. **Fair Points**: Harder questions = more points

### Bulk Operations
1. **Test Small**: Upload 1-2 questions first
2. **Validate JSON**: Use JSON validator before upload
3. **Backup First**: Export current questions before bulk changes
4. **Check IDs**: Ensure no duplicate IDs

### Asset Management
1. **Naming Convention**: `{questionId}-{purpose}.png`
2. **File Location**: Place in `backend/assets/images/`
3. **Reference Screenshots**: Generate expected outputs
4. **Optimize Images**: Compress before uploading

---

## 🐛 Troubleshooting

### "Question not found" after upload
- Check JSON structure matches template
- Verify question ID is unique
- Restart backend server to reload data

### Navigation buttons not showing
- Ensure level has multiple questions
- Check questions share same courseId and level
- Refresh page after adding questions

### Bulk upload shows "skipped"
- Duplicate question IDs detected
- Missing required fields (id, title, level)
- Check error array in response

### Assets not displaying
- Verify image exists in `backend/assets/images/`
- Check path starts with `/assets/images/`
- Ensure backend serves static assets (nginx config)

---

## 📊 Summary

### Features Implemented
✅ **Question Navigation**: Previous/Next buttons with counter
✅ **Add/Edit Questions**: Full form with all fields
✅ **Bulk Upload**: JSON import with validation
✅ **Question Randomization**: API endpoint for random selection
✅ **Sample Downloads**: JSON and CSV templates
✅ **Question Management**: View, filter, edit, delete

### API Endpoints Added
```
POST   /api/courses/:courseId/questions/bulk       - Bulk upload
GET    /api/courses/:courseId/levels/:level/randomize - Random questions
GET    /api/courses/sample/json                    - Download JSON template
GET    /api/courses/sample/csv                     - Download CSV template
```

### Files Modified
- `frontend/src/pages/ChallengeView.jsx` - Added navigation
- `frontend/src/components/QuestionManagerModal.jsx` - Enhanced management
- `frontend/src/components/QuestionEditModal.jsx` - NEW: Edit form
- `backend/routes/courses.js` - Added bulk/randomize endpoints
- `frontend/src/services/api.js` - Added API functions

---

## 🚀 Next Steps

1. **Test Navigation**: Try moving between questions in a level
2. **Create Questions**: Use the Add Question form
3. **Try Bulk Upload**: Download sample, edit, upload
4. **Test Randomization**: Call the randomize endpoint
5. **Build Question Bank**: Create 48+ questions (8 per level × 6 levels)

Need help? Check the code or ask for clarification!
