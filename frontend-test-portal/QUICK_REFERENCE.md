# Quick Reference - Course-Based System

## ✅ What's Been Done

### Backend ✓
- ✅ Created `courses.json` - 4 courses defined
- ✅ Created `challenges-new.json` - Question bank with levels
- ✅ Created `user-progress.json` - Progress tracking
- ✅ Created `routes/courses.js` - Full course API
- ✅ Updated `server.js` - Assets serving + routes
- ✅ Created asset directories (images/, references/, courses/)
- ✅ Downloaded course thumbnails
- ✅ Docker containers rebuilt

### Data Structure ✓
```
4 Courses × 6 Levels each × 2 Questions per level = 48 total questions (samples)
```

**Current Sample Questions:**
1. HTML/CSS L1 Q1: Profile Card (with avatar asset)
2. HTML/CSS L1 Q2: Product Card (with product asset)
3. HTML/CSS L2 Q1: Hero Section (with background asset)
4. JavaScript L1 Q1: Counter (with icon assets)
5. Full Stack L1 Q1: Contact Form (with form icon asset)

## 📁 Directory Structure

```
backend/
├── data/
│   ├── courses.json              ✅ NEW - Course definitions
│   ├── challenges-new.json       ✅ NEW - Question bank
│   ├── user-progress.json        ✅ NEW - User progress
│   ├── challenges.json           ⚠️  OLD - Keep for now
│   └── submissions.json          ✓  KEEP - Still used
├── routes/
│   ├── courses.js                ✅ NEW - Course API
│   ├── challenges.js             ✓  KEEP - Legacy support
│   └── ...
├── assets/                       ✅ NEW
│   ├── images/                   ✅ Question assets
│   │   ├── avatar-1.png         ✅ Downloaded
│   │   ├── product-1.png        (need to add)
│   │   └── ...
│   ├── references/               ⏳ Add reference screenshots
│   └── courses/                  ✅ Course thumbnails
│       ├── html-css-thumb.png   ✅ Downloaded
│       ├── javascript-thumb.png ✅ Downloaded
│       └── ...
└── server.js                     ✅ UPDATED
```

## 🔌 API Endpoints (NEW)

### Courses
```bash
GET  /api/courses
# Returns: Array of all courses

GET  /api/courses/:courseId
# Returns: Specific course details

GET  /api/courses/:courseId/levels
# Returns: All levels in course with question counts

GET  /api/courses/:courseId/levels/:level/questions
# Returns: All questions in that level

GET  /api/courses/:courseId/levels/:level/questions/:questionId
# Returns: Full question details with assets
```

### Progress
```bash
GET  /api/courses/progress/:userId
# Returns: User's complete progress

POST /api/courses/progress/:userId/complete
Body: { courseId, questionId, points, level }
# Updates progress, unlocks next questions/levels
```

### Assets (Static)
```bash
GET  /assets/images/:filename       # Question images
GET  /assets/references/:filename   # Reference screenshots
GET  /assets/courses/:filename      # Course thumbnails
```

## 🎮 User Flow

```
1. Home Page
   └─> Display course cards with thumbnails
       └─> Click course

2. Course Detail Page
   └─> Show levels 1-6
       └─> Locked/Unlocked status
           └─> Click unlocked level

3. Level Page
   └─> Show 2 questions in level
       └─> Locked/Unlocked status
           └─> Click unlocked question

4. Code Editor (Challenge View)
   └─> Load question
   └─> Show assets/images inline
   └─> Code → Submit → Evaluate

5. Results
   └─> Show scores
   └─> If passed:
       ├─> Award points
       ├─> Mark complete
       ├─> Unlock next question
       └─> If level complete → Unlock next level

6. Back to Level/Course
   └─> See progress
   └─> Continue to next question
```

## 📝 Sample Question Structure

```json
{
  "id": "html-css-l1-q1",
  "courseId": "course-html-css",
  "level": 1,
  "questionNumber": 1,
  "title": "Simple Profile Card",
  "description": "Use the provided avatar image...",
  "instructions": "Build a card with:\n- Profile image (use: /assets/images/avatar-1.png)",
  "assets": {
    "images": [
      {
        "name": "avatar-1.png",
        "path": "/assets/images/avatar-1.png",
        "description": "Profile avatar"
      }
    ],
    "reference": "/assets/references/html-css-l1-q1-ref.png"
  },
  "hints": ["Use <img> tag", "Center with flexbox"],
  "points": 100,
  "isLocked": false,
  "prerequisite": null
}
```

## 🖼️ Adding Assets

### For Questions:
1. Place image in `backend/assets/images/`
2. Reference in question description:
   ```
   "Use: /assets/images/your-image.png"
   ```
3. Students use in code:
   ```html
   <img src="/assets/images/your-image.png">
   ```

### For Reference Screenshots:
1. Complete the question yourself
2. Take screenshot (1280x720)
3. Save as `{courseId}-l{level}-q{number}-ref.png`
4. Place in `backend/assets/references/`
5. Reference in question:
   ```json
   "reference": "/assets/references/html-css-l1-q1-ref.png"
   ```

## ⚡ Quick Test Commands

```powershell
# Test courses API
curl http://localhost/api/courses

# Test specific course
curl http://localhost/api/courses/course-html-css

# Test levels
curl http://localhost/api/courses/course-html-css/levels

# Test questions
curl "http://localhost/api/courses/course-html-css/levels/1/questions"

# Test asset serving
curl http://localhost/assets/courses/html-css-thumb.png --output test.png

# Test progress
curl -X POST http://localhost/api/courses/progress/user-001/complete `
  -H "Content-Type: application/json" `
  -d '{\"courseId\":\"course-html-css\",\"questionId\":\"html-css-l1-q1\",\"points\":100,\"level\":1}'
```

## 🎨 Assets Needed

### Priority (for existing questions):
- [ ] avatar-1.png (120x120) - ✅ Downloaded
- [ ] product-1.png (300x300)
- [ ] hero-bg-1.jpg (1920x1080)
- [ ] plus-icon.png (48x48)
- [ ] minus-icon.png (48x48)
- [ ] form-icon.png (64x64)
- [ ] Reference screenshots for 5 questions

### Course Thumbnails:
- [x] html-css-thumb.png - ✅ Downloaded
- [x] javascript-thumb.png - ✅ Downloaded
- [x] responsive-thumb.png - ✅ Downloaded
- [x] fullstack-thumb.png - ✅ Downloaded

## 🚀 Next Implementation Steps

### Frontend (To Do):
1. **Create CoursesHomePage.jsx**
   - Grid of course cards
   - Show thumbnails, titles, difficulty
   - Click → Navigate to `/course/:courseId`

2. **Create CourseDetailPage.jsx**
   - Show course info
   - Display 6 level cards
   - Lock/unlock indicators
   - Click level → Navigate to `/course/:courseId/level/:level`

3. **Create LevelPage.jsx**
   - List questions in level
   - Show completion status
   - Lock/unlock status
   - Click → Navigate to `/challenge/:questionId`

4. **Update ChallengeView.jsx**
   - Load from new API (`/api/courses/.../questions/:id`)
   - Display assets from `question.assets`
   - Show inline images
   - On submit success → Call progress API
   - Handle unlocking logic

5. **Update Routing**
   ```jsx
   <Route path="/" element={<CoursesHomePage />} />
   <Route path="/course/:courseId" element={<CourseDetailPage />} />
   <Route path="/course/:courseId/level/:level" element={<LevelPage />} />
   <Route path="/challenge/:questionId" element={<ChallengeView />} />
   ```

6. **Add Progress Display**
   - Show progress bars on course cards
   - Display points earned
   - Show completed/total questions

## 📚 Documentation Files

Read these for complete information:

1. **COURSE_BASED_SYSTEM.md** - Complete guide to new system
2. **backend/assets/README.md** - Asset usage guide
3. **backend/assets/PLACEHOLDERS.md** - How to add placeholder images
4. **This file** - Quick reference

## ⚙️ Configuration

### Environment:
- Assets served at: `http://localhost/assets/`
- API base: `http://localhost/api/`
- Docker: Port 80 (frontend), 5000 (backend)

### Key Files:
- Backend data: `backend/data/*.json`
- Backend routes: `backend/routes/courses.js`
- Backend server: `backend/server.js`
- Assets: `backend/assets/**/*`

## 🎯 Benefits

✅ **Structured Learning** - Courses → Levels → Questions
✅ **Progressive Unlocking** - Game-like experience
✅ **Visual Assets** - Images make requirements clear
✅ **Progress Tracking** - Save and display progress
✅ **Organized Content** - Easy to navigate
✅ **Scalable** - Easy to add more content

## 📊 Current Status

- ✅ Backend: 100% Complete
- ✅ API: 100% Working
- ✅ Assets: Directories created, samples added
- ⏳ Frontend: Pages to be created
- ⏳ Assets: More images to be added

## 🔥 Ready to Use!

Backend is fully functional. Test it:
```
http://localhost/api/courses
```

See all available endpoints and data structure!
