# Course-Based Learning Platform - Complete Transformation

## 🎯 What Changed

Transformed from **LeetCode-style challenges** (Easy/Medium/Hard) to a **structured learning platform** with courses, levels, and progressive unlocking.

## 📚 New Structure

### Old System (LeetCode Style)
```
Challenges → Select Difficulty → Code → Submit
```

### New System (Course-Based Learning)
```
Home → Course Cards → Course Details → Levels (1-6) → 
Question Cards → Code Editor → Submit → Result → 
Next Level Unlock → Repeat
```

## 🗂️ Data Structure

### 1. Courses (`courses.json`)
Each course represents a learning path:

```json
{
  "id": "course-html-css",
  "title": "HTML & CSS Fundamentals",
  "description": "Master web development basics",
  "thumbnail": "/assets/courses/html-css-thumb.png",
  "icon": "🎨",
  "color": "#FF6B6B",
  "totalLevels": 6,
  "estimatedTime": "4 hours",
  "difficulty": "Beginner",
  "tags": ["HTML", "CSS", "Layout"],
  "isLocked": false
}
```

**Available Courses:**
1. 🎨 HTML & CSS Fundamentals (Beginner)
2. ⚡ JavaScript Basics (Beginner)
3. 📱 Responsive Design (Intermediate)
4. 🚀 Full Stack Projects (Advanced)

### 2. Challenges/Questions (`challenges-new.json`)
Each question belongs to a course and level:

```json
{
  "id": "html-css-l1-q1",
  "courseId": "course-html-css",
  "level": 1,
  "questionNumber": 1,
  "title": "Simple Profile Card",
  "description": "Create a profile card with provided avatar",
  "instructions": "Build a card with: ...",
  "assets": {
    "images": [
      {
        "name": "avatar-1.png",
        "path": "/assets/images/avatar-1.png",
        "description": "Profile avatar image"
      }
    ],
    "reference": "/assets/references/html-css-l1-q1-ref.png"
  },
  "hints": ["Tip 1", "Tip 2"],
  "points": 100,
  "isLocked": false,
  "prerequisite": null
}
```

### 3. User Progress (`user-progress.json`)
Tracks completion and unlocking:

```json
{
  "userId": "user-001",
  "courses": [
    {
      "courseId": "course-html-css",
      "currentLevel": 2,
      "completedQuestions": ["html-css-l1-q1", "html-css-l1-q2"],
      "totalPoints": 200,
      "progress": 33
    }
  ],
  "totalPoints": 200
}
```

## 🎨 Assets System

### Directory Structure
```
backend/assets/
├── images/          # Question assets (avatars, products, icons)
│   ├── avatar-1.png
│   ├── product-1.png
│   ├── hero-bg-1.jpg
│   └── ...
├── references/      # Expected output screenshots
│   ├── html-css-l1-q1-ref.png
│   └── ...
└── courses/         # Course thumbnails
    ├── html-css-thumb.png
    └── ...
```

### Using Assets in Questions

**In Challenge Description:**
```
"Create a profile card with the provided avatar image."
```

**In Instructions:**
```
"- Profile image (use: /assets/images/avatar-1.png)"
```

**In Assets Object:**
```json
"assets": {
  "images": [
    {
      "name": "avatar-1.png",
      "path": "/assets/images/avatar-1.png",
      "description": "Profile avatar image"
    }
  ],
  "reference": "/assets/references/html-css-l1-q1-ref.png"
}
```

**In Student's HTML:**
```html
<img src="/assets/images/avatar-1.png" alt="Profile">
```

## 🔌 API Endpoints

### Courses
```
GET  /api/courses                              # List all courses
GET  /api/courses/:courseId                     # Get course details
GET  /api/courses/:courseId/levels              # Get all levels in course
GET  /api/courses/:courseId/levels/:level/questions  # Get questions in level
GET  /api/courses/:courseId/levels/:level/questions/:questionId  # Get specific question
```

### Progress Tracking
```
GET  /api/courses/progress/:userId              # Get user progress
POST /api/courses/progress/:userId/complete     # Mark question completed
     Body: { courseId, questionId, points, level }
```

### Assets
```
GET  /assets/images/:filename                   # Get image asset
GET  /assets/references/:filename               # Get reference screenshot
GET  /assets/courses/:filename                  # Get course thumbnail
```

## 🎮 User Flow

### 1. Home Page
- Display course cards with thumbnails
- Show progress if user has started
- Click card → Go to course details

### 2. Course Details Page
- Show course info (title, description, difficulty)
- Display levels 1-6 as cards or list
- Show lock icon on locked levels
- Click unlocked level → Show questions

### 3. Level View
- Show 2 question cards per level
- Display: title, points, completion status
- Click question → Go to code editor

### 4. Code Editor (Challenge View)
- Show question title, description, instructions
- Display asset images if any
- Show reference screenshot (toggle button)
- Code editor (HTML, CSS, JS)
- Live preview
- Submit button

### 5. Results
- Show scores (Structure %, Visual %, Overall %)
- Display screenshots comparison
- Award points
- If passed:
  - Add points to user
  - Unlock next question
  - If all questions in level done → Unlock next level

### 6. Next Level Unlock
- Show celebration/unlock animation
- Display new level card
- User continues to next level

## 🎯 Example Flow

```
User starts → Sees 4 course cards

User clicks "HTML & CSS Fundamentals" →
  Sees Level 1-6 (Level 1 unlocked, rest locked)

User clicks Level 1 →
  Sees 2 questions:
    ✓ Question 1: Simple Profile Card (100 pts)
    🔒 Question 2: Product Card (locked)

User clicks Question 1 →
  Code editor loads
  Sees instruction: "Use /assets/images/avatar-1.png"
  User writes code:
    <img src="/assets/images/avatar-1.png">
  Submits

Result: PASSED (85%) →
  Earned 100 points
  Question 2 unlocked

User clicks Question 2 →
  Completes it
  Passes

Result: Level 1 Complete →
  Level 2 unlocked! 🎉
  User can now access Level 2 questions
```

## 📝 Sample Questions Created

### HTML & CSS Course

**Level 1:**
1. Simple Profile Card (with avatar image)
2. Product Card with Image (with product image)

**Level 2:**
1. Hero Section with Background (with hero background image)

### JavaScript Course

**Level 1:**
1. Interactive Counter (with plus/minus icons)

### Full Stack Course

**Level 1:**
1. Contact Form with Validation (with form icon)

## 🖼️ Creating Assets

### Option 1: Placeholder Images (Quick Setup)
Use the provided PowerShell script in `PLACEHOLDERS.md`:

```powershell
cd backend\assets\images
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=John+Doe&size=120" -OutFile "avatar-1.png"
```

### Option 2: Real Images
1. Find royalty-free images from Unsplash, Pexels
2. Resize to required dimensions
3. Save in appropriate directory
4. Update path in challenge JSON

### Option 3: Create Custom Images
1. Use design tools (Figma, Canva, Photoshop)
2. Create branded assets
3. Export to PNG/JPG
4. Place in assets directory

## 🔧 Backend Changes

### Files Added:
- ✅ `backend/data/courses.json` - Course definitions
- ✅ `backend/data/challenges-new.json` - Question bank
- ✅ `backend/data/user-progress.json` - Progress tracking
- ✅ `backend/routes/courses.js` - Course API routes
- ✅ `backend/assets/` - Asset directories

### Files Modified:
- ✅ `backend/server.js` - Added assets serving + courses routes

## 🎨 Frontend Changes Needed

You'll need to create new frontend pages:

### 1. Home/Courses Page (`CoursesPage.jsx`)
```jsx
// Display course cards
// Click → Navigate to /course/:courseId
```

### 2. Course Detail Page (`CourseDetailPage.jsx`)
```jsx
// Show course info
// Display levels 1-6
// Click level → Navigate to /course/:courseId/level/:level
```

### 3. Level Page (`LevelPage.jsx`)
```jsx
// Show questions in level
// Display lock status
// Click question → Navigate to /challenge/:questionId
```

### 4. Update Challenge View (`ChallengeView.jsx`)
```jsx
// Load question by ID
// Display assets from question.assets
// On submit success → Update progress
// Navigate to next question or level
```

## 🚀 Deployment Steps

### 1. Setup Assets (Required!)
```powershell
# Navigate to backend
cd backend\assets

# Run placeholder download script from PLACEHOLDERS.md
# OR add your own images manually
```

### 2. Test Backend
```bash
# Start backend
cd backend
npm run dev

# Test endpoints
curl http://localhost:5000/api/courses
curl http://localhost:5000/api/courses/course-html-css
curl http://localhost:5000/api/courses/course-html-css/levels
```

### 3. Update Frontend
- Create new pages for courses, levels
- Update routing
- Update API calls to use new endpoints
- Add progress tracking

### 4. Rebuild Docker
```powershell
cd frontend-test-portal
docker-compose build
docker-compose up -d
```

## 📊 Progress Tracking Logic

### When Question Completed:
```javascript
POST /api/courses/progress/:userId/complete
{
  "courseId": "course-html-css",
  "questionId": "html-css-l1-q1",
  "points": 100,
  "level": 1
}
```

### Response:
- Updates user progress
- Unlocks next question (if any)
- Unlocks next level (if level complete)
- Returns updated progress

### Frontend can then:
```javascript
// Check if level complete
if (allQuestionsInLevelDone) {
  // Show "Level Complete" modal
  // Display "Level X Unlocked!"
  // Navigate to next level
}
```

## 🎓 Benefits of New System

1. **Progressive Learning**: Students follow a path
2. **Motivation**: Unlock system creates game-like experience
3. **Organized**: Content grouped by topics
4. **Visual**: Assets make questions clearer
5. **Tracked**: Progress saved and visible
6. **Scalable**: Easy to add more courses/levels

## 📚 Adding More Content

### To Add a New Course:
1. Add entry to `courses.json`
2. Create thumbnail image
3. Add questions to `challenges-new.json` with matching `courseId`

### To Add Questions to Existing Course:
1. Decide level (1-6)
2. Create question entry in `challenges-new.json`
3. Add required assets
4. Set prerequisite (previous question ID)

### To Add Assets:
1. Place image in `assets/images/`
2. Reference in question's `assets` object
3. Students use: `<img src="/assets/images/your-image.png">`

## ✅ Current Status

- ✅ Backend structure complete
- ✅ API endpoints created
- ✅ Asset system configured
- ✅ Sample courses defined
- ✅ Sample questions created
- ✅ Progress tracking ready
- ⏳ Frontend pages to be built
- ⏳ Assets to be added (placeholders provided)

## 🎯 Next Steps

1. **Add placeholder images** using provided script
2. **Create frontend pages** for new structure
3. **Update routing** to match new flow
4. **Test complete user journey**
5. **Add more courses and questions**
6. **Create real assets** (replace placeholders)

---

**This is a complete learning management system (LMS) for coding education!** 🚀
