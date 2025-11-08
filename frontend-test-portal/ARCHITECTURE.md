# 🏗️ Architecture Documentation

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Candidate   │  │    Admin     │  │   Monaco     │      │
│  │  Dashboard   │  │  Dashboard   │  │   Editor     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Services    │  │    Data      │      │
│  │  (API Layer) │  │  (Business)  │  │  (Storage)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Evaluation Engine
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Hybrid Evaluation System                        │
│  ┌────────────────────┐      ┌────────────────────┐         │
│  │  DOM Comparison    │      │  Pixel Matching    │         │
│  │    (jsdom)         │      │   (Puppeteer)      │         │
│  │                    │      │                    │         │
│  │ • Parse HTML       │      │ • Render pages     │         │
│  │ • Build DOM tree   │      │ • Capture screens  │         │
│  │ • Compare nodes    │      │ • Pixel compare    │         │
│  │ • Calculate score  │      │ • Generate diff    │         │
│  └────────────────────┘      └────────────────────┘         │
│          ▼                            ▼                      │
│       40% weight                   60% weight                │
│          └──────────────┬──────────────┘                     │
│                         ▼                                    │
│                  Final Score + Feedback                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Architecture

### 1. Frontend Architecture

#### Pages Structure
```
src/pages/
├── CandidateDashboard.jsx    # Challenge browsing
├── ChallengeView.jsx          # Main coding interface
├── AdminLogin.jsx             # Authentication
├── AdminDashboard.jsx         # Submission review
└── ChallengeManager.jsx       # CRUD operations
```

#### Components Structure
```
src/components/
├── CodeEditor.jsx             # Monaco editor wrapper
├── PreviewFrame.jsx           # Sandboxed iframe
├── ResultsPanel.jsx           # Evaluation display
├── ChallengeCard.jsx          # Challenge preview card
└── SubmissionList.jsx         # Admin submission table
```

#### State Management
- **React Hooks**: useState, useEffect, useRef
- **Local Storage**: Admin token, draft code
- **API Layer**: Centralized in services/api.js

---

### 2. Backend Architecture

#### API Routes

**Public Routes:**
```javascript
GET  /api/challenges          # List all challenges
GET  /api/challenges/:id      # Get challenge details
POST /api/submissions         # Submit solution
GET  /api/submissions/:id     # Get submission
```

**Admin Routes:**
```javascript
POST   /api/admin/login               # Authenticate
GET    /api/admin/challenges          # Get all (with solutions)
POST   /api/admin/challenges          # Create challenge
PUT    /api/admin/challenges/:id      # Update challenge
DELETE /api/admin/challenges/:id      # Delete challenge
GET    /api/admin/submissions         # All submissions
POST   /api/admin/evaluate/:id        # Re-evaluate
```

**Evaluation Routes:**
```javascript
POST /api/evaluate              # Run evaluation
POST /api/evaluate/quick        # Test without saving
```

---

### 3. Evaluation Engine Architecture

#### DOM Comparison Service (`domCompare.js`)

**Algorithm:**
```
1. Parse HTML using jsdom
2. Build normalized DOM trees
3. Traverse both trees recursively
4. Compare at each level:
   - Tag names
   - Attributes (id, class, type, etc.)
   - Text content
   - Children count
   - Hierarchy depth
5. Track matches and mismatches
6. Calculate similarity percentage
```

**Score Calculation:**
```javascript
score = (passedChecks / totalChecks) × 100
```

**Example Checks:**
- ✓ Tag name matches
- ✓ ID attribute present and correct
- ✓ CSS classes present
- ✓ Important attributes (type, href, src)
- ✓ Text content similarity
- ✓ Children count matches
- ✓ Proper nesting depth

---

#### Pixel Matching Service (`pixelMatch.js`)

**Algorithm:**
```
1. Create full HTML pages with CSS/JS injected
2. Launch headless Chrome via Puppeteer
3. Set consistent viewport (1280x720)
4. Navigate to both pages
5. Wait for rendering (load, networkidle)
6. Capture PNG screenshots
7. Load images using pngjs
8. Compare pixel-by-pixel using pixelmatch
9. Generate difference image (red highlights)
10. Calculate similarity percentage
```

**Score Calculation:**
```javascript
diffPixels = pixelmatch(candidate, expected, diff, width, height)
totalPixels = width × height
diffPercentage = (diffPixels / totalPixels) × 100
score = 100 - diffPercentage
```

**Pixelmatch Settings:**
```javascript
{
  threshold: 0.1,      // Sensitivity (0-1)
  alpha: 0.1,          // Opacity consideration
  diffColor: [255, 0, 0],  // Red for differences
}
```

---

#### Main Evaluator Service (`evaluator.js`)

**Orchestration Flow:**
```
1. Receive submission and expected solution
2. Run DOM comparison (async)
3. Run pixel matching (async)
4. Wait for both to complete
5. Calculate weighted scores:
   - DOM: 40%
   - Visual: 60%
6. Check against thresholds
7. Generate detailed feedback
8. Return comprehensive result
```

**Result Structure:**
```javascript
{
  submissionId: string,
  timestamp: ISO string,
  structureScore: number,     // 0-100
  visualScore: number,        // 0-100
  finalScore: number,         // Weighted average
  passed: boolean,
  thresholds: object,
  dom: {
    score: number,
    passed: boolean,
    details: object,
    checks: { total, passed }
  },
  pixel: {
    score: number,
    passed: boolean,
    diffPixels: number,
    totalPixels: number,
    screenshots: { candidate, expected, diff }
  },
  feedback: [
    { type, category, message }
  ]
}
```

---

## Data Flow

### Submission to Evaluation Flow

```
1. Candidate writes code
   ↓
2. Frontend: submitSolution()
   ↓
3. Backend: POST /api/submissions
   - Save to submissions.json
   - Return submissionId
   ↓
4. Frontend: evaluateSolution(submissionId)
   ↓
5. Backend: POST /api/evaluate
   - Get submission from storage
   - Get challenge expected solution
   ↓
6. Evaluator Service:
   ├─→ DOM Comparison (parallel)
   └─→ Pixel Matching (parallel)
   ↓
7. Combine results
   ↓
8. Update submission with result
   ↓
9. Return result to frontend
   ↓
10. Frontend: Display in ResultsPanel
```

---

## Security Considerations

### Current Implementation (Prototype)
- Simple username/password auth
- Mock JWT tokens
- No input sanitization
- No rate limiting
- Local file storage

### Production Recommendations

**Authentication:**
- Implement real JWT with signing
- Use bcrypt for password hashing
- Add refresh token mechanism
- Session management

**Input Validation:**
- Sanitize all user inputs
- Validate HTML/CSS/JS before execution
- Limit code size
- Check for malicious patterns

**Sandbox Security:**
- Isolated code execution
- Resource limits (CPU, memory)
- Timeout mechanisms
- Blocked dangerous APIs

**API Security:**
- Rate limiting (express-rate-limit)
- CORS configuration
- CSRF protection
- API key authentication

---

## Database Schema (Future)

### Tables/Collections Needed

**Users Table:**
```javascript
{
  id: UUID,
  username: string,
  email: string,
  passwordHash: string,
  role: enum['admin', 'candidate'],
  createdAt: timestamp
}
```

**Challenges Table:**
```javascript
{
  id: UUID,
  title: string,
  difficulty: enum['Easy', 'Medium', 'Hard'],
  description: text,
  instructions: text,
  tags: array,
  timeLimit: integer,
  passingThreshold: json,
  expectedSolution: json,
  createdBy: UUID (FK),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Submissions Table:**
```javascript
{
  id: UUID,
  challengeId: UUID (FK),
  userId: UUID (FK),
  candidateName: string,
  code: json,
  status: enum['pending', 'passed', 'failed'],
  result: json,
  submittedAt: timestamp,
  evaluatedAt: timestamp
}
```

**Screenshots Table:**
```javascript
{
  id: UUID,
  submissionId: UUID (FK),
  candidateUrl: string,
  expectedUrl: string,
  diffUrl: string,
  createdAt: timestamp
}
```

---

## Performance Optimization

### Current Limitations
- Synchronous evaluation (blocks)
- Local screenshot storage
- No caching
- Single-threaded

### Optimization Strategies

**1. Queue System:**
```
Backend → Redis Queue → Worker Processes
                ↓
         Parallel evaluation
                ↓
         Store results in DB
                ↓
         WebSocket notification
```

**2. Caching:**
- Cache challenge data (Redis)
- Cache expected screenshots
- Memoize DOM comparisons

**3. Image Storage:**
- Upload to S3/Cloudinary
- CDN distribution
- Automatic cleanup

**4. Database Optimization:**
- Index frequently queried fields
- Use connection pooling
- Query optimization

---

## Scalability Considerations

### Horizontal Scaling

**Backend:**
- Stateless API servers
- Load balancer (nginx)
- Multiple instances
- Shared session storage (Redis)

**Evaluation Workers:**
- Separate worker services
- Message queue (RabbitMQ/SQS)
- Auto-scaling based on queue length

**Database:**
- Master-slave replication
- Read replicas
- Sharding by user/challenge

---

## Testing Strategy

### Unit Tests
- DOM comparison logic
- Pixel matching algorithm
- API endpoints
- React components

### Integration Tests
- Full evaluation flow
- API route testing
- Database operations

### E2E Tests
- User submission flow
- Admin challenge creation
- Evaluation accuracy

---

## Monitoring & Logging

### Metrics to Track
- Evaluation time (avg, p95, p99)
- Success/failure rates
- API response times
- Queue length
- Resource usage

### Logging
- Structured logging (Winston/Pino)
- Log levels (info, warn, error)
- Request/response logging
- Evaluation pipeline logs

---

## Deployment Architecture

### Recommended Setup

```
┌─────────────────────────────────────────────┐
│           CloudFlare CDN                    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│        Load Balancer (nginx)                │
└────┬────────────────────────────────────┬───┘
     │                                    │
┌────▼─────────┐              ┌──────────▼────┐
│  Frontend    │              │   Backend      │
│  (Vercel)    │              │   (Railway)    │
└──────────────┘              └────────┬───────┘
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
                ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
                │ PostgreSQL │   │   Redis   │   │    S3     │
                │    (DB)    │   │  (Queue)  │   │ (Images)  │
                └────────────┘   └───────────┘   └───────────┘
```

---

This architecture is designed to be:
- ✅ Modular and maintainable
- ✅ Scalable for growth
- ✅ Testable at all levels
- ✅ Production-ready with enhancements

For questions or contributions, please refer to README.md
