# ✅ Setup & Testing Checklist

Use this checklist to verify your Frontend Test Portal installation and ensure everything works correctly.

---

## 📋 Pre-Installation Checklist

### System Requirements
- [ ] Windows OS (PowerShell available)
- [ ] Node.js 18+ installed
- [ ] npm installed (comes with Node.js)
- [ ] Chrome/Chromium installed (for Puppeteer)
- [ ] At least 2GB free RAM
- [ ] At least 1GB free disk space
- [ ] Text editor/IDE installed (VS Code recommended)

### Verification Commands
```powershell
node --version        # Should show v18.x.x or higher
npm --version         # Should show 9.x.x or higher
Get-Command chrome    # Should find Chrome executable
```

---

## 🚀 Installation Checklist

### Automated Setup
- [ ] Navigate to `frontend-test-portal` directory
- [ ] Run `.\setup.ps1` in PowerShell
- [ ] Wait for backend dependencies installation
- [ ] Wait for frontend dependencies installation
- [ ] Check for any error messages
- [ ] Verify "Setup Complete!" message appears

### Manual Setup (Alternative)
#### Backend
- [ ] Navigate to `backend` folder
- [ ] Run `npm install`
- [ ] Wait for completion without errors
- [ ] Verify `node_modules` folder created
- [ ] Check `package-lock.json` exists

#### Frontend
- [ ] Navigate to `frontend` folder
- [ ] Run `npm install`
- [ ] Wait for completion without errors
- [ ] Verify `node_modules` folder created
- [ ] Check `package-lock.json` exists

---

## 🏃 Startup Checklist

### Backend Server
- [ ] Open Terminal 1
- [ ] Navigate to `backend` folder
- [ ] Run `npm run dev`
- [ ] Wait for "Server running on http://localhost:5000" message
- [ ] Check no error messages appear
- [ ] Server stays running (doesn't crash)
- [ ] Terminal shows nodemon watching for changes

### Frontend Server
- [ ] Open Terminal 2 (new terminal)
- [ ] Navigate to `frontend` folder
- [ ] Run `npm run dev`
- [ ] Wait for "ready in X ms" message
- [ ] Check for URL display (http://localhost:5173)
- [ ] Server stays running
- [ ] Vite shows ready status

---

## 🌐 Browser Access Checklist

### Initial Access
- [ ] Open browser (Chrome/Edge/Firefox)
- [ ] Navigate to `http://localhost:5173`
- [ ] Page loads without errors
- [ ] No console errors (F12 to check)
- [ ] Gradient background appears
- [ ] "Frontend Test Portal" header visible

### Network Check
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Refresh page
- [ ] Check API call to `http://localhost:5000/api/challenges`
- [ ] Verify 200 OK response
- [ ] Check response contains challenge data

---

## 🎯 Candidate Portal Testing

### Dashboard View
- [ ] See "Frontend Test Portal" header
- [ ] See challenge filter buttons (All, Easy, Medium, Hard)
- [ ] See 4 challenge cards displayed
- [ ] Each card shows:
  - [ ] Title
  - [ ] Difficulty badge
  - [ ] Description
  - [ ] Tags
  - [ ] Time limit
  - [ ] "Start Challenge" button

### Filter Testing
- [ ] Click "Easy" button
- [ ] Verify only easy challenges show
- [ ] Click "Medium" button
- [ ] Verify only medium challenges show
- [ ] Click "All" button
- [ ] Verify all 4 challenges show

### Challenge Selection
- [ ] Click on any challenge card
- [ ] Navigate to challenge view
- [ ] URL changes to `/challenge/[id]`

---

## 💻 Code Editor Testing

### Editor Interface
- [ ] See challenge instructions panel
- [ ] See passing criteria box
- [ ] See code editor with three tabs:
  - [ ] HTML tab
  - [ ] CSS tab
  - [ ] JavaScript tab
- [ ] See preview panel
- [ ] See control buttons (Run Code, Submit)

### Editor Functionality
- [ ] Click HTML tab - editor switches
- [ ] Click CSS tab - editor switches
- [ ] Click JavaScript tab - editor switches
- [ ] Type in HTML editor - text appears
- [ ] Check syntax highlighting works
- [ ] Check line numbers visible
- [ ] Check code completion suggestions appear

### Preview Testing
- [ ] Write simple HTML: `<h1>Test</h1>`
- [ ] Click "Run Code" button
- [ ] Verify preview updates
- [ ] See "Test" heading in preview
- [ ] Write CSS: `h1 { color: red; }`
- [ ] Click "Run Code"
- [ ] Verify text turns red

---

## 📤 Submission Testing

### Submit Flow
- [ ] Write some code (any code)
- [ ] Click "Submit & Evaluate" button
- [ ] See name modal pop up
- [ ] Enter test name: "Test User"
- [ ] Click "Submit" in modal
- [ ] Modal closes
- [ ] See "Evaluating..." message
- [ ] Wait for evaluation (3-5 seconds)

### Results Display
- [ ] See results panel appear
- [ ] See overall result (Passed/Failed)
- [ ] See final score percentage
- [ ] See score breakdown:
  - [ ] Structure (DOM) score
  - [ ] Visual (Pixel) score
- [ ] See screenshot comparison section:
  - [ ] Your output image
  - [ ] Expected output image
  - [ ] Difference image
- [ ] See detailed feedback messages
- [ ] See collapsible DOM details

---

## 🔐 Admin Portal Testing

### Admin Login
- [ ] Click "Admin Login" in header
- [ ] Navigate to `/admin/login`
- [ ] See login form
- [ ] Enter username: `admin`
- [ ] Enter password: `admin123`
- [ ] Click "Login" button
- [ ] Redirect to `/admin/dashboard`

### Admin Dashboard
- [ ] See "Admin Dashboard" header
- [ ] See statistics cards:
  - [ ] Total Submissions
  - [ ] Passed count
  - [ ] Failed count
  - [ ] Pending count
- [ ] See "Recent Submissions" section
- [ ] See "Manage Challenges" button
- [ ] See "Logout" button

### Submissions Review
- [ ] See list of submissions (if any)
- [ ] Each submission shows:
  - [ ] Candidate name
  - [ ] Challenge ID
  - [ ] Status badge
  - [ ] Score
  - [ ] Timestamp
- [ ] Click "View Code" on a submission
- [ ] See code expand/collapse
- [ ] Click "Re-evaluate" button
- [ ] Confirm re-evaluation works

---

## ✏️ Challenge Management Testing

### Access Challenge Manager
- [ ] Click "Manage Challenges" in admin dashboard
- [ ] Navigate to `/admin/challenges`
- [ ] See list of all 4 challenges
- [ ] Each challenge shows:
  - [ ] Title and difficulty
  - [ ] Description
  - [ ] Time limit
  - [ ] Edit button
  - [ ] Delete button

### Create Challenge
- [ ] Click "+ Create Challenge" button
- [ ] See form modal open
- [ ] Fill in required fields:
  - [ ] Title: "Test Challenge"
  - [ ] Difficulty: "Easy"
  - [ ] Description: "Test description"
  - [ ] Instructions: "Test instructions"
  - [ ] Time limit: 15
  - [ ] Expected HTML: `<div>Test</div>`
  - [ ] Expected CSS: `div { color: blue; }`
- [ ] Click "Create Challenge"
- [ ] Modal closes
- [ ] New challenge appears in list

### Edit Challenge
- [ ] Click "Edit" on any challenge
- [ ] See form modal with existing data
- [ ] Modify title: "Updated Title"
- [ ] Click "Update Challenge"
- [ ] Modal closes
- [ ] See updated title in list

### Delete Challenge
- [ ] Click "Delete" on test challenge
- [ ] See confirmation dialog
- [ ] Click "OK"
- [ ] Challenge removed from list

---

## 🔍 Error Handling Testing

### Backend Errors
- [ ] Stop backend server
- [ ] Try to load challenges in frontend
- [ ] See error handling (graceful failure)
- [ ] Restart backend server
- [ ] Refresh page - should work again

### Invalid Inputs
- [ ] Try to submit empty code
- [ ] Verify submission still processes
- [ ] Try to login with wrong password
- [ ] See error message "Invalid credentials"
- [ ] Try to access `/admin/dashboard` without login
- [ ] Redirect to login page

---

## 📸 Screenshot Testing

### Screenshot Generation
- [ ] Submit a solution (any code)
- [ ] Wait for evaluation
- [ ] Open backend/screenshots folder
- [ ] Verify three images created:
  - [ ] `[id]-candidate.png`
  - [ ] `[id]-expected.png`
  - [ ] `[id]-diff.png`
- [ ] Open images - verify they're valid PNGs
- [ ] Check diff image shows red highlights

---

## 🔧 Developer Testing

### Backend API
- [ ] Open browser to `http://localhost:5000/health`
- [ ] See `{ status: "OK" }` response
- [ ] Test GET `/api/challenges`
- [ ] See JSON array of challenges
- [ ] Check browser console for API errors

### Frontend Hot Reload
- [ ] Open any frontend component file
- [ ] Make a text change
- [ ] Save file
- [ ] Verify browser auto-refreshes
- [ ] See your change reflected

### Backend Hot Reload
- [ ] Open `backend/server.js`
- [ ] Add a console.log
- [ ] Save file
- [ ] Check terminal shows "restarting"
- [ ] See your log message

---

## 📊 Performance Testing

### Load Time
- [ ] Clear browser cache
- [ ] Reload frontend
- [ ] Check page loads in < 2 seconds
- [ ] Check no console errors

### Evaluation Speed
- [ ] Submit simple code
- [ ] Time the evaluation
- [ ] Verify completes in 3-5 seconds
- [ ] Check backend logs for timing

---

## 🎉 Final Verification

### Complete Workflow Test
- [ ] Browse challenges as candidate
- [ ] Select and code a challenge
- [ ] Run preview multiple times
- [ ] Submit and get evaluated
- [ ] Login as admin
- [ ] View the submission
- [ ] Re-evaluate submission
- [ ] Create a new challenge
- [ ] Test new challenge as candidate
- [ ] Logout from admin

### Documentation Check
- [ ] README.md opens and renders correctly
- [ ] QUICKSTART.md has clear instructions
- [ ] All links in docs work
- [ ] Code examples are accurate

---

## ✅ Success Criteria

All items checked = **Setup Complete!** 🎉

### If Issues Found:

1. **Backend won't start**:
   - Check Node.js version
   - Delete `node_modules` and reinstall
   - Check port 5000 not in use

2. **Frontend won't start**:
   - Delete `node_modules` and reinstall
   - Check port 5173 not in use
   - Clear npm cache: `npm cache clean --force`

3. **Evaluation fails**:
   - Check Puppeteer installed correctly
   - Verify Chrome/Chromium available
   - Check backend logs for errors

4. **Screenshots not generating**:
   - Verify `backend/screenshots` folder exists
   - Check file permissions
   - Check disk space available

---

## 📞 Support

If you've completed this checklist and everything works:
**🎉 Congratulations! Your setup is perfect!**

If you encountered issues:
1. Review error messages carefully
2. Check the documentation files
3. Verify all prerequisites met
4. Try manual setup instead of automated
5. Check Node.js and npm versions

---

**Last Updated**: November 8, 2025
**Checklist Version**: 1.0

✅ Happy Testing!
