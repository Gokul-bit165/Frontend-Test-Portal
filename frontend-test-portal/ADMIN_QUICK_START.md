# 🎓 Admin Quick Start Guide - Level-Based Question Management

## 🚀 Getting Started (5 Minutes)

### Step 1: Login to Admin Panel
1. Open browser: **http://localhost/admin/login**
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click **Login**

### Step 2: Navigate to Course Management
1. Click **"📚 Manage Courses"** button
2. You'll see all available courses:
   - HTML & CSS Fundamentals
   - JavaScript Basics
   - Responsive Design
   - Full Stack Projects

### Step 3: Open Question Manager
1. Find your course (e.g., "HTML & CSS Fundamentals")
2. Click **"📝 Manage Questions"** button
3. The Question Manager modal opens

---

## 📝 Managing Questions for Each Level

### What You'll See

The modal shows:
```
┌─────────────────────────────────────────────┐
│ 📚 Manage Questions: HTML & CSS             │
│                               [🔒 Manage...] │
├─────────────────────────────────────────────┤
│                                             │
│  📝 Upload Questions by Level               │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Level 1  │  │ Level 2  │  │ Level 3  │ │
│  │  5 Q's   │  │  3 Q's   │  │  2 Q's   │ │
│  │ 🎲 2 rand│  │ 🎲 3 rand│  │ 🎲 1 rand│ │
│  │          │  │          │  │          │ │
│  │ ⬇️ Templ │  │ ⬇️ Templ │  │ ⬇️ Templ │ │
│  │ ⬆️ Upload│  │ ⬆️ Upload│  │ ⬆️ Upload│ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  [Similar cards for Level 4, 5, 6]         │
└─────────────────────────────────────────────┘
```

Each level card shows:
- **Level number** (1-6)
- **Question count** (how many questions exist)
- **🎲 Randomize count** (how many random questions students get)
- **⬇️ Download Template** button
- **⬆️ Upload Questions** button

---

## 📥 Download Template for a Level

### Example: Creating Questions for Level 1

1. **Click** the **"⬇️ Download Template"** button on Level 1 card
2. A JSON file downloads: `course-html-css-level-1-template.json`
3. Open the file in any text editor (Notepad, VS Code, etc.)

### Template Structure

The template contains **2 sample questions** to guide you:

```json
[
  {
    "id": "course-html-css-l1-q1",
    "courseId": "course-html-css",
    "level": 1,
    "title": "Build a Profile Card",
    "description": "Create a centered profile card with user information",
    "instructions": "Follow these steps to complete:\n- Create a div with class 'profile-card'\n- Add an image\n- Add name heading\n- Add role paragraph",
    "tags": ["HTML", "CSS", "Flexbox"],
    "timeLimit": 15,
    "passingThreshold": {
      "structure": 70,
      "visual": 80,
      "overall": 75
    },
    "expectedSolution": {
      "html": "<div class=\"profile-card\">\n  <img src=\"/assets/images/avatar-1.png\" class=\"profile-img\" />\n  <h2>John Doe</h2>\n  <p class=\"role\">Web Developer</p>\n</div>",
      "css": ".profile-card {\n  width: 300px;\n  padding: 20px;\n  text-align: center;\n  background: white;\n  border-radius: 15px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}",
      "js": ""
    },
    "assets": {
      "images": [
        {
          "name": "avatar",
          "path": "/assets/images/avatar-1.png",
          "description": "User profile avatar"
        }
      ]
    },
    "hints": [
      "Start with a container div",
      "Use flexbox for centering",
      "Set a fixed width for the card"
    ]
  },
  {
    "id": "course-html-css-l1-q2",
    "courseId": "course-html-css",
    "level": 1,
    "title": "Create a Navigation Bar",
    "description": "Build a responsive navigation bar",
    "instructions": "Create a nav element with 4 links: Home, About, Services, Contact",
    "tags": ["HTML", "CSS", "Navbar"],
    "timeLimit": 20,
    "expectedSolution": {
      "html": "<nav class=\"navbar\">\n  <a href=\"#\">Home</a>\n  <a href=\"#\">About</a>\n  <a href=\"#\">Services</a>\n  <a href=\"#\">Contact</a>\n</nav>",
      "css": ".navbar {\n  display: flex;\n  justify-content: space-around;\n  background: #1f2937;\n  padding: 20px;\n}\n.navbar a {\n  color: white;\n  text-decoration: none;\n}",
      "js": ""
    },
    "assets": {
      "images": []
    },
    "hints": [
      "Use flexbox for layout",
      "Add padding to nav element"
    ]
  }
]
```

---

## ✏️ Editing the Template

### Add More Questions

Copy one of the sample questions and modify it:

```json
[
  // Keep existing questions...
  {
    "id": "course-html-css-l1-q3",  // ⚠️ IMPORTANT: Unique ID!
    "courseId": "course-html-css",  // Must match your course
    "level": 1,                     // Must be 1 for Level 1
    "title": "YOUR QUESTION TITLE",
    "description": "What students need to build",
    "instructions": "Step-by-step guide:\n- Step 1\n- Step 2\n- Step 3",
    "tags": ["HTML", "CSS"],
    "timeLimit": 15,                // Minutes
    "expectedSolution": {
      "html": "<!-- Expected HTML code -->",
      "css": "/* Expected CSS code */",
      "js": "// Expected JavaScript (if needed)"
    },
    "assets": {
      "images": []  // Add if question needs images
    },
    "hints": [
      "Hint 1 for students",
      "Hint 2 for students"
    ]
  }
]
```

### Important Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `id` | ✅ Yes | Unique identifier | `"course-html-css-l1-q3"` |
| `courseId` | ✅ Yes | Course identifier | `"course-html-css"` |
| `level` | ✅ Yes | Level number (1-6) | `1` |
| `title` | ✅ Yes | Question title | `"Build a Card"` |
| `description` | ✅ Yes | Brief summary | `"Create a card..."` |
| `instructions` | ✅ Yes | Detailed steps | `"Step 1...\nStep 2..."` |
| `tags` | Optional | Keywords | `["HTML", "CSS"]` |
| `timeLimit` | Optional | Minutes (default: 30) | `15` |
| `expectedSolution` | ✅ Yes | Code to compare against | See above |
| `assets` | Optional | Images/references | `{"images": [...]}` |
| `hints` | Optional | Help for students | `["Hint 1", "Hint 2"]` |

---

## 📤 Upload Edited Questions

### Step 1: Open Upload Modal
1. In Question Manager, click **"⬆️ Upload Questions"** on Level 1
2. Upload modal appears

### Step 2: Set Randomization
```
Randomize Count for Level 1: [3]
Students will get 3 random question(s) from this level
```

**What this means:**
- If you upload 5 questions to Level 1
- Set randomize count to **3**
- Each student will get **3 randomly selected** questions from those 5
- Different students may get different questions

### Step 3: Paste JSON
1. Copy your **entire edited JSON array** (including `[` and `]`)
2. Paste into the large text area
3. Verify it's valid JSON (brackets match, commas correct)

### Step 4: Upload
1. Click **"⬆️ Upload Questions"** button
2. Wait for confirmation message
3. Message shows: "Level 1 updated successfully! Added: 5 questions"
4. Questions appear in the list below

---

## 🔒 Managing Exam Restrictions

### Opening Restrictions Panel

1. In Question Manager, click **"🔒 Manage Restrictions"**
2. Restrictions modal opens

### Available Restrictions

#### 1. Block Copy ✂️
```
☑️ Block Copy
   Prevent students from copying text from the exam
```
- **ON:** Students cannot copy question text or instructions
- **OFF:** Students can copy text normally

#### 2. Block Paste 📋
```
☑️ Block Paste
   Prevent students from pasting text into the code editor
```
- **ON:** Students cannot paste code from external sources
- **OFF:** Students can paste code

#### 3. Force Fullscreen 🖥️
```
☑️ Force Fullscreen
   Require fullscreen mode throughout the exam
```
- **ON:** Student must stay in fullscreen, cannot minimize or switch tabs
- **OFF:** Student can use browser normally

#### 4. Max Violations ⚠️
```
Max Violations: [3] violations allowed
```
- If fullscreen is forced, this counts how many times student can:
  - Press ESC (exit fullscreen)
  - Switch tabs (Alt+Tab)
  - Minimize window
- After reaching max violations, test **auto-finishes** and submits

### Example Configuration

**Strict Exam Mode:**
```
✅ Block Copy: ON
✅ Block Paste: ON
✅ Force Fullscreen: ON
Max Violations: 2
```

**Relaxed Mode:**
```
❌ Block Copy: OFF
❌ Block Paste: OFF
❌ Force Fullscreen: OFF
Max Violations: 5
```

### Save Restrictions
1. Toggle settings as desired
2. Set max violations number
3. Click **"💾 Save Restrictions"**
4. Confirmation message appears
5. Settings apply to **entire course** (all levels)

---

## 🎯 Complete Workflow Example

### Scenario: Setting up "HTML & CSS Fundamentals" Course

#### Level 1: Easy Questions (5 questions, randomize 2)
1. Click "Download Template" for Level 1
2. Edit JSON to add 5 easy questions (profile cards, simple layouts)
3. Click "Upload Questions" for Level 1
4. Set randomize count to **2**
5. Paste JSON and upload
6. ✅ Students will get 2 random easy questions

#### Level 2: Medium Questions (4 questions, randomize 3)
1. Download template for Level 2
2. Add 4 medium questions (navigation bars, hero sections)
3. Upload with randomize count **3**
4. ✅ Students get 3 random medium questions

#### Level 3-6: Continue similarly
- Add progressively harder questions
- Adjust randomization based on difficulty
- More questions = more variety

#### Set Restrictions
1. Click "Manage Restrictions"
2. Enable Block Copy, Block Paste, Force Fullscreen
3. Set Max Violations to **3**
4. Save
5. ✅ All tests now have strict security

---

## 📊 Monitoring Questions

### View All Questions by Level

Below the level cards, you'll see:
```
[All Levels] [L1 (5)] [L2 (3)] [L3 (2)] [L4 (0)] [L5 (0)] [L6 (0)]
```

Click any level button to filter questions:

```
┌─────────────────────────────────────────────┐
│ Level 1 - Q1           15 pts   [✏️] [🗑️]  │
│ Build a Profile Card                        │
│ Master the building blocks...               │
│ 📝 ID: course-html-css-l1-q1                │
│ 🖼️ 1 asset(s)  💡 3 hint(s)                │
└─────────────────────────────────────────────┘
```

### Individual Question Actions

- **✏️ Edit:** Open detailed editor for single question
- **🗑️ Delete:** Remove question (asks for confirmation)
- **+ Add Question:** Create new question manually (form-based)

---

## ⚡ Quick Tips

### Do's ✅
- Always use unique IDs for questions (e.g., `l1-q1`, `l1-q2`)
- Keep level number consistent in JSON (`"level": 1`)
- Set realistic time limits (15-30 minutes per question)
- Add helpful hints for students
- Test your expected solutions work correctly
- Use assets (images) from `/assets/images/` folder
- Set randomize count based on total questions (2-4 is good)

### Don'ts ❌
- Don't duplicate question IDs
- Don't forget to set `courseId` correctly
- Don't make expectedSolution too strict (allow variations)
- Don't set randomize count higher than total questions
- Don't forget to save restrictions after changing them
- Don't upload broken JSON (validate first)

---

## 🐛 Troubleshooting

### Problem: Upload fails with "Failed to upload"
**Solution:** Check your JSON is valid
- Use https://jsonlint.com to validate
- Ensure all brackets `[]` and braces `{}` match
- Check for missing commas
- Verify quotes are correct

### Problem: Questions don't appear after upload
**Solution:** Refresh the page
- Close and reopen Question Manager modal
- Check filter (click "All Levels")
- Verify courseId matches in JSON

### Problem: Template downloads empty
**Solution:** Backend might not be ready
- Refresh page and try again
- Check browser console for errors
- Verify backend is running: http://localhost:5000

### Problem: Restrictions don't save
**Solution:** Reload and try again
- Ensure you clicked "Save Restrictions"
- Check for success message
- Reload course manager to verify

---

## 🎉 Success Checklist

After setup, verify:
- [ ] Downloaded template for Level 1
- [ ] Edited and added 3+ questions
- [ ] Uploaded successfully with randomize count
- [ ] Set exam restrictions
- [ ] Clicked Save
- [ ] Verified questions appear in list
- [ ] Tested as student (different account)
- [ ] Confirmed randomization works
- [ ] Confirmed restrictions work

---

## 🔗 Quick Links

- **Admin Login:** http://localhost/admin/login
- **Student Portal:** http://localhost
- **Backend API:** http://localhost:5000
- **API Docs:** See `IMPLEMENTATION_SUMMARY.md`

---

## 📞 Need Help?

If you encounter issues:
1. Check `JSON_FALLBACK_FIX.md` for data loading issues
2. Check `COMPLETE_IMPLEMENTATION.md` for technical details
3. Verify Docker containers are running: `docker ps`
4. Check backend logs: `docker logs test-portal-backend`

---

**You're all set! Start creating amazing coding challenges! 🚀**
