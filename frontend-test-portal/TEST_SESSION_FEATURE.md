# Test Session Management Feature

## Overview
This feature tracks multi-question test attempts and provides comprehensive results with user feedback collection.

## What's New

### 1. Test Session Tracking
- **Database Table**: `test_sessions` table tracks complete test attempts
- **Schema**: 
  - `id`: Unique session identifier
  - `user_id`: User taking the test
  - `course_id` & `level`: Test context
  - `submission_ids`: JSON array of all question submissions
  - `total_questions` & `passed_count`: Question statistics
  - `overall_status`: ENUM('passed', 'failed')
  - `user_feedback`: User's feedback text
  - `started_at` & `completed_at`: Timestamps

### 2. Backend API Endpoints
All endpoints are prefixed with `/api/test-sessions`

#### Create Session
```
POST /api/test-sessions
Body: { user_id, course_id, level }
Returns: Created session object
```

#### Get Session
```
GET /api/test-sessions/:id
Returns: Session object
```

#### Get Session with Details
```
GET /api/test-sessions/:id/details
Returns: Session with full submission details
```

#### Add Submission to Session
```
POST /api/test-sessions/:id/submissions
Body: { submission_id }
Returns: Updated session
```

#### Complete Session
```
PUT /api/test-sessions/:id/complete
Body: { user_feedback }
Returns: Updated session with overall pass/fail status
```

#### Get User's Sessions
```
GET /api/test-sessions/user/:userId?limit=20
Returns: Array of user's test sessions
```

### 3. Frontend Components

#### LevelChallengeNew.jsx Updates
- Creates test session on test start
- Tracks session ID throughout test
- Adds each submission to session
- Automatically navigates to results page when all questions submitted

#### TestResultsPage.jsx (New)
- Beautiful results summary page
- Shows overall pass/fail status
- Displays all questions attempted with scores
- Individual question breakdown:
  - Content Score
  - Visual Score
  - Structure Score
  - Final Score
  - Pass/Fail status
- Feedback collection form
- "Retry Test" button if failed
- "Back to Course" navigation

#### SubmissionList.jsx Updates
- Displays user feedback in admin dashboard
- Shows feedback in blue section below evaluation feedback

### 4. User Flow

1. **Start Test**: User navigates to level challenge
2. **Session Created**: Backend creates test_sessions record
3. **Answer Questions**: User attempts questions one by one
4. **Submit Each Answer**: Each submission added to session
5. **All Submitted**: Automatic redirect to results page
6. **View Results**: See overall pass/fail and individual scores
7. **Provide Feedback**: User writes feedback about test experience
8. **Submit Feedback**: Feedback saved, overall status calculated
9. **Continue**: Return to course or retry test

### 5. Pass/Fail Logic

- **Overall Pass**: ALL questions must pass (passed_count === total_questions)
- **Overall Fail**: Any question fails
- **Status Calculation**: Done in TestSession.complete() method
- Checks each submission's `passed` field or `status === 'passed'`

### 6. Admin Features

- View all test sessions (future enhancement)
- See user feedback in submission details
- Track which questions users struggle with
- Identify test completion rates

## Database Migration

Execute: `backend/database/add-test-sessions.sql`

```sql
CREATE TABLE IF NOT EXISTS test_sessions (
    id VARCHAR(100) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    user_id VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    course_id VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    level INT NOT NULL,
    submission_ids JSON NOT NULL,
    total_questions INT DEFAULT 0,
    passed_count INT DEFAULT 0,
    overall_status ENUM('passed', 'failed') DEFAULT 'failed',
    user_feedback TEXT COLLATE utf8mb4_unicode_ci NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_user (user_id),
    INDEX idx_course_level (course_id, level),
    CONSTRAINT fk_test_session_user 
      FOREIGN KEY (user_id) 
      REFERENCES frontend_test_portal.users(id) 
      ON DELETE CASCADE
);
```

## Files Modified/Created

### Backend
- ✅ `backend/models/TestSession.js` - Model for test sessions
- ✅ `backend/routes/testSessions.js` - API routes
- ✅ `backend/server.js` - Added route import and registration
- ✅ `backend/database/add-test-sessions.sql` - Migration SQL
- ✅ `backend/database/schema.sql` - Updated (user_feedback column)

### Frontend
- ✅ `frontend/src/pages/TestResultsPage.jsx` - Results page component
- ✅ `frontend/src/pages/LevelChallengeNew.jsx` - Added session tracking
- ✅ `frontend/src/components/SubmissionList.jsx` - Added feedback display
- ✅ `frontend/src/App.jsx` - Added route for /test-results/:sessionId

## Testing

1. Navigate to a test level
2. Answer 2 questions
3. Submit both questions
4. Verify redirect to results page
5. Check overall pass/fail status
6. Provide feedback
7. Verify feedback visible in admin dashboard

## Future Enhancements

1. Test session list in admin dashboard
2. Analytics: average completion time, question difficulty
3. Partial submission save (auto-save drafts)
4. Email notifications of test results
5. Certificate generation for passed tests
6. Test retry limits and cooldown periods
7. Question randomization history tracking
8. Time-limited tests with countdown timer
