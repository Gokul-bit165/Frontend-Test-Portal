# 🚀 Quick Start Guide

## Setup Instructions

### Backend Setup

1. **Navigate to backend folder:**
```powershell
cd backend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start the server:**
```powershell
npm run dev
```

Backend will run on: `http://localhost:5000`

---

### Frontend Setup

1. **Open a new terminal and navigate to frontend folder:**
```powershell
cd frontend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start the development server:**
```powershell
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🎮 Usage

### For Candidates:

1. Open browser: `http://localhost:5173`
2. Browse available challenges
3. Click "Start Challenge"
4. Write HTML, CSS, and JavaScript
5. Click "Run Code" to preview
6. Click "Submit & Evaluate" for auto-grading

### For Admins:

1. Click "Admin Login"
2. Use credentials: `admin` / `admin123`
3. View submissions and scores in Dashboard
4. Manage challenges in Challenge Manager
5. Create/Edit/Delete challenges
6. Re-evaluate submissions

---

## 📊 Evaluation Process

### Hybrid Method Explained:

1. **DOM Comparison (40% weight)**
   - Parses HTML with jsdom
   - Compares element structure
   - Validates attributes, classes, IDs
   - Checks hierarchy and nesting

2. **Pixel Matching (60% weight)**
   - Renders both solutions with Puppeteer
   - Captures screenshots (1280x720)
   - Compares pixel-by-pixel using pixelmatch
   - Generates difference image

3. **Final Score**
   - Formula: `(DOM × 0.4) + (Visual × 0.6)`
   - Both thresholds must pass
   - Detailed feedback provided

---

## 📁 Project Structure

```
frontend-test-portal/
├── backend/                    # Node.js/Express API
│   ├── server.js              # Entry point
│   ├── routes/                # API endpoints
│   ├── services/              # Evaluation logic
│   │   ├── domCompare.js     # DOM comparison
│   │   ├── pixelMatch.js     # Screenshot comparison
│   │   └── evaluator.js      # Main orchestrator
│   └── data/                  # JSON storage (replace with DB)
│
└── frontend/                   # React + Vite
    ├── src/
    │   ├── pages/             # Route pages
    │   ├── components/        # Reusable components
    │   └── services/          # API client
    └── index.html
```

---

## 🔧 Technologies Used

**Backend:**
- Node.js + Express
- jsdom (DOM parsing)
- Puppeteer (screenshot capture)
- pixelmatch (pixel comparison)

**Frontend:**
- React 18
- Vite (build tool)
- Monaco Editor (code editor)
- Tailwind CSS (styling)
- React Router (navigation)

---

## 🎯 Sample Challenge Flow

1. Admin creates challenge with expected solution
2. Candidate selects challenge and starts coding
3. Candidate writes HTML/CSS/JS in Monaco editor
4. Candidate previews in sandboxed iframe
5. Candidate submits solution
6. Backend evaluates:
   - DOM tree comparison
   - Visual pixel matching
7. Results displayed with:
   - Structure score
   - Visual score
   - Final score
   - Screenshots comparison
   - Detailed feedback

---

## 💡 Tips

- **For testing:** Use provided sample challenges
- **For development:** Backend auto-restarts with nodemon
- **For production:** Replace JSON files with database
- **For security:** Add JWT authentication
- **For scaling:** Use queue system (Redis + Bull)

---

## 🐛 Troubleshooting

**Port already in use:**
```powershell
# Change port in vite.config.js or server.js
```

**Puppeteer installation issues:**
```powershell
# Ensure Chrome/Chromium is installed
npm install puppeteer --save
```

**CORS errors:**
```powershell
# Backend CORS is configured for localhost
# Update if deploying to production
```

---

## 📝 Demo Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

---

## 🚀 Next Steps for Production

1. Replace JSON files with PostgreSQL/MongoDB
2. Add JWT authentication
3. Implement WebSocket for real-time updates
4. Add queue system for evaluation
5. Deploy backend to Heroku/Railway
6. Deploy frontend to Vercel/Netlify
7. Store screenshots in S3/Cloudinary
8. Add rate limiting and input validation
9. Implement user registration
10. Add more challenge types

---

Enjoy building with the Frontend Test Portal! 🎉
