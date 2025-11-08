# 🎯 Frontend Test Portal - LeetCode for HTML/CSS/JS

A full-stack web platform for evaluating frontend coding skills using hybrid DOM comparison and pixel-matching technology.

## 🚀 Quick Start (Docker - Recommended)

```powershell
# One command setup!
.\docker-setup.ps1

# Open browser
http://localhost
```

**That's it!** Docker handles everything: backend, frontend, Puppeteer, Nginx.

📚 **Full Docker Guide**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
📋 **Quick Reference**: [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)

---

## ✨ Latest Updates

### 🐳 Docker Implementation
- **One-command setup** - No manual configuration needed
- **Production-ready** - Nginx reverse proxy, health checks
- **Puppeteer included** - Chromium pre-installed
- **Persistent volumes** - Data and screenshots saved

### 🖼️ Expected Screenshot Feature
- **Toggle button** on challenge page
- **See expected result** before coding
- **Side-by-side comparison** with your preview
- **Evaluation tips** - Understand how scoring works

### 🔧 Performance Improvements
- **6-12x faster evaluation** (60s → 10s)
- **No network errors** - Fixed timeout issues
- **Better error handling** - Graceful failures
- **Progress indicators** - Real-time feedback

📖 **Complete Update Summary**: [UPDATE_SUMMARY.md](./UPDATE_SUMMARY.md)

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + Vite, Monaco Editor, Tailwind CSS
- **Backend**: Node.js + Express, Puppeteer (screenshot), jsdom (DOM parsing)
- **Evaluation**: Hybrid DOM Tree Comparison + Pixel-level Visual Matching

### Evaluation Method Explained

#### 1. **DOM Comparison (Structure)**
- Parses candidate and reference HTML using jsdom
- Compares DOM tree structure (tags, hierarchy, depth)
- Validates attributes, classes, and IDs
- Generates structural similarity score (0-100%)

#### 2. **Pixel Matching (Visual)**
- Uses Puppeteer to render both candidate and reference solutions
- Captures screenshots of rendered output
- Performs pixel-by-pixel comparison using pixelmatch library
- Calculates visual similarity percentage
- Highlights differences visually

#### 3. **Hybrid Score**
- Final Score = (DOM Score × 0.4) + (Visual Score × 0.6)
- Both metrics must pass threshold for challenge completion
- Detailed breakdown provided to candidates

---

## 📁 Project Structure

```
frontend-test-portal/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── package.json
│   ├── routes/
│   │   ├── challenges.js      # Challenge CRUD operations
│   │   ├── submissions.js     # Submission handling
│   │   ├── evaluation.js      # Evaluation API
│   │   └── admin.js           # Admin authentication
│   ├── services/
│   │   ├── domCompare.js      # DOM tree comparison logic
│   │   ├── pixelMatch.js      # Screenshot & pixel comparison
│   │   └── evaluator.js       # Main evaluation orchestrator
│   ├── data/
│   │   ├── challenges.json    # Sample challenges (replace with DB)
│   │   ├── users.json         # Admin users (replace with DB)
│   │   └── submissions.json   # Submission records (replace with DB)
│   └── screenshots/           # Temporary screenshot storage
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Main app component
│   │   ├── pages/
│   │   │   ├── CandidateDashboard.jsx
│   │   │   ├── ChallengeView.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ChallengeManager.jsx
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx     # Monaco editor wrapper
│   │   │   ├── PreviewFrame.jsx   # Sandboxed iframe
│   │   │   ├── ResultsPanel.jsx   # Evaluation results display
│   │   │   ├── ChallengeCard.jsx
│   │   │   └── SubmissionList.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client functions
│   │   └── styles/
│   │       └── index.css      # Tailwind imports
│
└── README.md (this file)
```

---

## 🚀 Setup Instructions

### Option 1: Docker (Recommended)

**Prerequisites**: Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

```powershell
# First time setup
.\docker-setup.ps1

# Access application
http://localhost              # Frontend
http://localhost:5000         # Backend API

# Useful commands
docker-compose logs -f        # View logs
docker-compose restart        # Restart
docker-compose down           # Stop & remove
.\docker-rebuild.ps1         # Rebuild after code changes
```

**Full documentation**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

### Option 2: Manual Setup (Development)

### Prerequisites
- Node.js 18+ and npm
- Chrome/Chromium (for Puppeteer screenshots)

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🔐 Demo Credentials

### Admin Login
- **Username**: `admin`
- **Password**: `admin123`

---

## 🎮 How to Use

### For Candidates

1. **Browse Challenges**: View available coding challenges
2. **Select Challenge**: Click to open editor view
3. **Write Code**: Use Monaco editor for HTML, CSS, JS
4. **Run Code**: Preview output in sandboxed iframe
5. **Submit**: Click submit to trigger auto-evaluation
6. **View Results**: See DOM match, pixel match, and final score

### For Admins

1. **Login**: Use admin credentials
2. **Create Challenge**: Add new challenges with expected solutions
3. **View Submissions**: See all candidate submissions with scores
4. **Re-evaluate**: Manually trigger re-evaluation if needed
5. **Edit Challenges**: Update challenge descriptions or solutions

---

## 🧪 Evaluation Logic Deep Dive

### DOM Comparison Algorithm

```javascript
1. Parse both HTMLs using jsdom
2. Build normalized DOM trees
3. Compare:
   - Tag names at each level
   - Hierarchy and nesting depth
   - Attribute presence and values
   - Class and ID matching
   - Child count and order
4. Calculate similarity ratio
```

### Pixel Matching Algorithm

```javascript
1. Inject HTML/CSS/JS into temporary pages
2. Launch headless Chrome via Puppeteer
3. Navigate to both pages
4. Capture screenshots at same viewport size
5. Use pixelmatch library for comparison:
   - Pixel-by-pixel color difference
   - Anti-aliasing detection
   - Diff image generation
6. Calculate match percentage
```

### Scoring Formula

```
Structure Score = (Matching Nodes / Total Expected Nodes) × 100
Visual Score = ((Total Pixels - Diff Pixels) / Total Pixels) × 100
Final Score = (Structure × 0.4) + (Visual × 0.6)

Pass Threshold:
- Structure Score ≥ 70%
- Visual Score ≥ 80%
- Final Score ≥ 75%
```

---

## 🔌 API Endpoints

### Public Endpoints

```
GET    /api/challenges              # List all challenges
GET    /api/challenges/:id          # Get specific challenge
POST   /api/submissions             # Submit solution
GET    /api/submissions/:id/result  # Get evaluation result
```

### Admin Endpoints (Protected)

```
POST   /api/admin/login             # Admin authentication
POST   /api/admin/challenges        # Create challenge
PUT    /api/admin/challenges/:id    # Update challenge
DELETE /api/admin/challenges/:id    # Delete challenge
GET    /api/admin/submissions       # List all submissions
POST   /api/admin/evaluate/:id      # Re-run evaluation
```

---

## 📦 Dependencies

### Backend
- `express` - Web framework
- `cors` - Cross-origin support
- `jsdom` - DOM parsing and manipulation
- `puppeteer` - Headless browser for screenshots
- `pixelmatch` - Pixel comparison
- `pngjs` - PNG image processing

### Frontend
- `react` & `react-dom` - UI library
- `@monaco-editor/react` - Code editor
- `react-router-dom` - Routing
- `axios` - HTTP client
- `tailwindcss` - Utility-first CSS

---

## 🔮 Future Enhancements (Production Readiness)

### Database Integration
- Replace JSON files with PostgreSQL/MongoDB
- Add proper user authentication (JWT)
- Store screenshots in S3/Cloudinary

### Security
- Input sanitization and validation
- Rate limiting on API endpoints
- Secure sandbox environment for code execution
- CSRF protection

### Features
- Real-time collaboration
- Code version history
- Hints and tutorials
- Leaderboards and badges
- Multi-language support
- Test case editor for admins

### Performance
- Queue system for evaluation (Bull/Redis)
- Caching for frequently accessed challenges
- CDN for static assets
- WebSocket for real-time updates

---

## 🐛 Known Limitations (Prototype)

- No persistent database (uses JSON files)
- Simple auth (no JWT/sessions)
- Screenshots stored locally (not scalable)
- No concurrent evaluation handling
- Limited error handling
- No rate limiting

---

## 📄 License

MIT License - Feel free to modify and use for your projects

---

## 👨‍💻 Author

Built as a prototype for frontend skill evaluation platform.

For questions or contributions, please reach out!
