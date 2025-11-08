# 🎲 Random Question Assignment & Level Unlock System

## ✅ Features Implemented

### 1. Random Question Assignment
- **When**: User accesses a level for the first time
- **How**: System randomly selects **2 questions** from all available questions in that level
- **Storage**: Assignments are stored in `backend/data/user-assignments.json`
- **Persistence**: Same user always gets same 2 questions for that level

### 2. Level Unlock System
- **Level 1**: Always unlocked
- **Level 2-6**: Locked until previous level is completed
- **Completion**: Level is complete when BOTH assigned questions are passed
- **Auto-unlock**: Next level unlocks immediately upon completion

### 3. Progress Tracking
- **Per Question**: Tracks when each question is completed
- **Per Level**: Tracks completion status and assigned questions
- **Per Course**: Tracks total points and current level
- **Storage**: Progress stored in `backend/data/user-progress.json`

---

## 🎯 How It Works

### First Time Access
```
User clicks Level 1 → System checks user-assignments.json
→ No assignment found
→ Gets all questions for Level 1 (e.g., 10 questions available)
→ Randomly selects 2 questions
→ Saves assignment: user-1 → Level 1 → [question-3, question-7]
→ Shows those 2 questions to user
```

### Returning User
```
User clicks Level 1 again → System checks user-assignments.json
→ Assignment exists: [question-3, question-7]
→ Shows same 2 questions
→ Shows completion status (✅ or 📝)
```

### Completing Questions
```
User solves question-3 → Passes evaluation
→ System marks question-3 as complete in assignment
→ Checks: 1 of 2 questions done
→ Level NOT complete yet

User solves question-7 → Passes evaluation
→ System marks question-7 as complete
→ Checks: 2 of 2 questions done
→ Level 1 COMPLETE! 🎉
→ Level 2 UNLOCKED! 🔓
→ User redirected to course page
```

---

## 📊 Data Structure

### user-assignments.json
```json
[
  {
    "key": "default-user-course-html-css-1",
    "userId": "default-user",
    "courseId": "course-html-css",
    "level": 1,
    "assignedQuestions": ["html-css-l1-q3", "html-css-l1-q7"],
    "completedQuestions": ["html-css-l1-q3"],
    "assignedAt": "2025-11-08T10:00:00.000Z",
    "lastCompletedAt": "2025-11-08T10:15:00.000Z",
    "totalAvailable": 10,
    "isLevelComplete": false
  }
]
```

### user-progress.json
```json
[
  {
    "userId": "default-user",
    "courses": [
      {
        "courseId": "course-html-css",
        "completedLevels": [1],
        "currentLevel": 2,
        "totalPoints": 200
      }
    ],
    "totalPoints": 200,
    "achievements": []
  }
]
```

---

## 🚀 Testing the System

### Step 1: Add Multiple Questions
```bash
# Add 10 questions to Level 1 using bulk upload
# They will form the question bank
```

### Step 2: Access Level 1
```
1. Open http://localhost
2. Click any course
3. Click Level 1
4. You'll see 2 random questions selected from your 10
5. Note the blue info banner: "You've been assigned 2 random questions"
```

### Step 3: Complete First Question
```
1. Click first question
2. Write code and submit
3. Pass the evaluation
4. See alert: "Question Complete!"
5. Return to level
6. First question now shows ✅
```

### Step 4: Complete Second Question
```
1. Click second question
2. Write code and submit
3. Pass the evaluation
4. See alert: "Level 1 Complete! Level 2 Unlocked!"
5. Auto-redirect to course page
6. Level 2 now shows 🎯 (unlocked) instead of 🔒
```

### Step 5: Verify Persistence
```
1. Refresh the page
2. Go back to Level 1
3. Same 2 questions are shown (not re-randomized)
4. Both show ✅ (completed status maintained)
```

### Step 6: Access Level 2
```
1. Click Level 2 (now unlocked)
2. System assigns 2 NEW random questions
3. Repeat completion process
4. Level 3 unlocks when done
```

---

## 🎓 Example Scenario

### Course Setup
- **HTML & CSS Course**
- **Level 1**: 10 questions in question bank
- **Goal**: Each student does 2 random questions

### Student A Experience
```
Access Level 1 → Gets questions #3 and #7
Completes question #3 → 50% progress
Completes question #7 → 100% complete!
Level 2 unlocks → Gets questions #12 and #15
```

### Student B Experience
```
Access Level 1 → Gets questions #2 and #9 (different!)
Completes question #2 → 50% progress
Completes question #9 → 100% complete!
Level 2 unlocks → Gets questions #11 and #18 (different!)
```

---

## 💡 Key Benefits

### For Students
✅ **Fair Assessment**: Everyone gets questions of similar difficulty
✅ **Variety**: Different students get different questions
✅ **No Spoilers**: Can't share exact question list
✅ **Consistent Experience**: Same questions on return visits
✅ **Clear Progress**: See completion status (✅/📝)
✅ **Motivation**: Level unlock provides goal

### For Instructors
✅ **Anti-Cheating**: Students can't copy answers
✅ **Scalable**: Build large question banks
✅ **Flexible**: Easy to add/remove questions
✅ **Trackable**: Monitor individual progress
✅ **Automated**: No manual assignment needed

---

## 🔧 Configuration

### Change Number of Questions Per Level
**File**: `backend/routes/courses.js` line ~145
```javascript
// Current: selects 2 questions
const selectedQuestions = shuffled.slice(0, Math.min(2, allQuestions.length));

// Change to 3 questions:
const selectedQuestions = shuffled.slice(0, Math.min(3, allQuestions.length));
```

### Change Passing Requirements
**Current**: Must complete ALL assigned questions
**To change**: Modify completion check in `POST /api/courses/progress/:userId/complete`
```javascript
// Current: all questions must be done
const levelComplete = assignment.completedQuestions.length === assignment.assignedQuestions.length;

// Alternative: 80% of questions
const levelComplete = assignment.completedQuestions.length >= Math.ceil(assignment.assignedQuestions.length * 0.8);
```

---

## 📋 API Endpoints

### Get Assigned Questions
```
GET /api/courses/:courseId/levels/:level/questions?userId=user123
```
**Response**: 2 random questions (or previously assigned)
```json
[
  {
    "id": "html-css-l1-q3",
    "title": "Profile Card",
    "isCompleted": false,
    ...
  },
  {
    "id": "html-css-l1-q7",
    "title": "Product Grid",
    "isCompleted": true,
    ...
  }
]
```

### Mark Question Complete
```
POST /api/courses/progress/:userId/complete
Body: {
  "questionId": "html-css-l1-q3",
  "courseId": "course-html-css",
  "level": 1,
  "score": 85
}
```
**Response**:
```json
{
  "message": "Progress updated",
  "levelComplete": true,
  "nextLevelUnlocked": true,
  "nextLevel": 2,
  "completedQuestions": 2,
  "totalQuestions": 2,
  "points": 100,
  "totalPoints": 200
}
```

### Get User Progress
```
GET /api/courses/progress/:userId
```
**Response**:
```json
{
  "userId": "user123",
  "courses": [
    {
      "courseId": "course-html-css",
      "completedLevels": [1, 2],
      "currentLevel": 3,
      "totalPoints": 400
    }
  ],
  "totalPoints": 400,
  "achievements": []
}
```

---

## 🎯 Current Status

✅ **Random assignment working**
✅ **2 questions per level**
✅ **Assignment persistence**
✅ **Completion tracking**
✅ **Level unlocking**
✅ **Progress display**
✅ **User-specific assignments**
✅ **Completion alerts**

---

## 🧪 Testing Checklist

- [ ] Add 10 questions to Level 1 via bulk upload
- [ ] Access Level 1 → See 2 random questions
- [ ] Refresh page → Same 2 questions appear
- [ ] Complete first question → Shows ✅
- [ ] Complete second question → Level complete alert
- [ ] Level 2 shows unlocked (🎯 not 🔒)
- [ ] Access Level 2 → Get 2 new random questions
- [ ] Different user gets different questions
- [ ] Progress persists across sessions
- [ ] Backend logs show assignment messages

---

## 🎉 Success!

The system now:
1. ✅ Randomly selects 2 questions from question bank
2. ✅ Maintains same assignment for each user
3. ✅ Tracks completion per question
4. ✅ Unlocks next level when both done
5. ✅ Shows clear progress indicators
6. ✅ Prevents cheating with variety
7. ✅ Provides motivating experience

**Ready to use with your question banks!**

---

## 📞 Support

### Questions showing duplicate?
- Check `user-assignments.json` - delete entry to reset
- Assignments are per user, per course, per level

### Level not unlocking?
- Ensure BOTH questions are completed
- Check evaluation passed (score > threshold)
- Verify backend logs for completion messages

### Want to reset progress?
```bash
# Delete assignment files to start fresh
rm backend/data/user-assignments.json
rm backend/data/user-progress.json

# Or edit manually to remove specific user
```

### Testing with multiple users?
Change userId in localStorage:
```javascript
localStorage.setItem('userId', 'student-2');
// Refresh page to see different assignments
```

---

**System is live and ready!** 🚀
