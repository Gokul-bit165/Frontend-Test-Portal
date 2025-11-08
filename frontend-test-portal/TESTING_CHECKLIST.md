# ✅ Testing Checklist

## Pre-requisites
- [ ] Docker Desktop installed
- [ ] Docker Desktop is running
- [ ] PowerShell available
- [ ] Ports 80 and 5000 are free

---

## 🐳 Docker Setup Test

### Initial Setup
- [ ] Run `.\docker-setup.ps1`
- [ ] Script completes without errors
- [ ] Sees "🎉 Setup Complete!" message
- [ ] Both containers show as running

### Verify Containers
```powershell
docker-compose ps
```
- [ ] `test-portal-backend` - State: Up, Port: 5000
- [ ] `test-portal-frontend` - State: Up, Port: 80

### Test Endpoints
```powershell
# Backend health
curl http://localhost:5000/health
```
- [ ] Returns `{"status":"OK",...}`

```powershell
# API challenges
curl http://localhost:5000/api/challenges
```
- [ ] Returns JSON array with challenges

```powershell
# Frontend
curl http://localhost
```
- [ ] Returns HTML page

### Browser Test
- [ ] Open http://localhost
- [ ] Frontend loads successfully
- [ ] No console errors (F12)
- [ ] Sees challenge list

---

## 🖼️ Expected Screenshot Feature Test

### Navigation
- [ ] Click on any challenge card
- [ ] Challenge details page loads
- [ ] Code editor visible
- [ ] Live preview visible

### Toggle Button
- [ ] See "🎯 Show Expected Result" button (top-right of preview)
- [ ] Button has blue background
- [ ] Hover shows different color

### Show Expected Result
- [ ] Click "🎯 Show" button
- [ ] Button changes to "👁️ Hide Expected Result"
- [ ] New section appears below live preview
- [ ] Section header shows "✅ Expected Result"
- [ ] Expected solution preview renders
- [ ] Green border around expected preview
- [ ] Tips section visible below with:
  - [ ] "💡 Tip" heading
  - [ ] DOM Structure (40%) mention
  - [ ] Visual Appearance (60%) mention
  - [ ] Pixel count (921,600) mentioned

### Hide Expected Result
- [ ] Click "👁️ Hide" button
- [ ] Button changes back to "🎯 Show"
- [ ] Expected result section disappears
- [ ] Live preview still visible

### Visual Check
- [ ] Expected preview looks like a proper solution
- [ ] Preview frame has appropriate size
- [ ] No layout issues
- [ ] Scrolling works if needed

---

## 📝 Submit & Evaluate Test

### Preparation
- [ ] Write some HTML/CSS code in editor
- [ ] Click "▶ Run Code" to test
- [ ] Preview updates correctly

### Submit Flow
- [ ] Click "Submit & Evaluate" button
- [ ] Modal appears asking for name
- [ ] Enter your name
- [ ] Click "Submit" button
- [ ] Modal closes

### Evaluation Progress
Watch for these progress messages:
- [ ] "🚀 Starting evaluation..."
- [ ] "📸 Rendering screenshots..."
- [ ] "🔍 Comparing DOM structure..."
- [ ] "🎨 Matching pixels..."
- [ ] "📊 Calculating final score..."
- [ ] "✅ Complete!"

### Timing
- [ ] Start timer when clicking Submit
- [ ] Evaluation completes
- [ ] Stop timer
- [ ] **Should be 5-15 seconds** (not 60+)

### Results Display
- [ ] Results panel appears
- [ ] Shows scores:
  - [ ] Structure Score (%)
  - [ ] Visual Score (%)
  - [ ] Final Score (%)
  - [ ] Pass/Fail status
- [ ] Shows feedback messages
- [ ] If available, shows screenshots:
  - [ ] Your screenshot
  - [ ] Expected screenshot
  - [ ] Difference map

### Error Handling
- [ ] If evaluation fails, error message shown
- [ ] Error message is helpful
- [ ] No "Network Error" popup
- [ ] Backend stays running (check logs)

---

## 👨‍💼 Admin Panel Test

### Login
- [ ] Navigate to http://localhost/admin
- [ ] Login form visible
- [ ] Enter: username `admin`, password `admin123`
- [ ] Click "Login"
- [ ] Redirects to admin dashboard

### View Submissions
- [ ] Submissions list visible
- [ ] Shows candidate names
- [ ] Shows submission times
- [ ] Shows scores
- [ ] Shows pass/fail status

### Re-evaluate
- [ ] Click "Re-evaluate" on any submission
- [ ] Evaluation starts
- [ ] Completes in ~5-10 seconds
- [ ] Updated score shown
- [ ] **Should be same speed as challenge test**

### Screenshot Comparison
- [ ] Click "View Screenshots" or expand submission
- [ ] Three screenshots shown:
  - [ ] Candidate's screenshot
  - [ ] Expected screenshot
  - [ ] Difference map (red pixels)
- [ ] Can click to enlarge
- [ ] Can download screenshots
- [ ] Pixel statistics shown

---

## 🔄 Docker Management Test

### View Logs
```powershell
docker-compose logs -f
```
- [ ] Logs stream in real-time
- [ ] Backend logs visible
- [ ] Frontend logs visible
- [ ] No error messages
- [ ] Press Ctrl+C to stop

### Stop Containers
```powershell
docker-compose stop
```
- [ ] Both containers stop
- [ ] http://localhost not accessible
- [ ] http://localhost:5000 not accessible

### Start Containers
```powershell
docker-compose start
```
- [ ] Both containers start
- [ ] http://localhost accessible again
- [ ] http://localhost:5000 accessible again

### Restart Containers
```powershell
docker-compose restart
```
- [ ] Containers restart
- [ ] Application works after restart

### Code Change & Rebuild Test
- [ ] Make a small change to code (e.g., change a text)
- [ ] Run `.\docker-rebuild.ps1`
- [ ] Script completes
- [ ] Containers restart
- [ ] Open http://localhost
- [ ] Change is visible

### Remove Containers
```powershell
docker-compose down
```
- [ ] Containers removed
- [ ] Networks removed
- [ ] Volumes still exist (data preserved)

### Full Cleanup
```powershell
docker-compose down -v
```
- [ ] Containers removed
- [ ] Volumes removed
- [ ] Data deleted (screenshots, submissions)

---

## 🧪 Integration Test Scenarios

### Scenario 1: Complete User Journey
1. [ ] Open application
2. [ ] View challenge list
3. [ ] Click challenge
4. [ ] View expected result
5. [ ] Write code
6. [ ] Test with Run Code
7. [ ] Submit & Evaluate
8. [ ] View results
9. [ ] Go back to dashboard

### Scenario 2: Admin Review
1. [ ] User submits solution
2. [ ] Admin logs in
3. [ ] Views submissions
4. [ ] Sees new submission
5. [ ] Views screenshots
6. [ ] Re-evaluates if needed
7. [ ] Reviews scores

### Scenario 3: Multiple Submissions
1. [ ] Submit solution A
2. [ ] Wait for result
3. [ ] Submit solution B
4. [ ] Wait for result
5. [ ] Both complete successfully
6. [ ] No backend crashes

---

## 🚨 Edge Cases Test

### Empty Code Submission
- [ ] Try submitting with empty editor
- [ ] Should handle gracefully
- [ ] Shows appropriate error/low score

### Very Long Code
- [ ] Write lots of code (100+ lines)
- [ ] Submit successfully
- [ ] Evaluation completes
- [ ] No timeouts

### Special Characters
- [ ] Use special characters in code
- [ ] Use emojis
- [ ] Submit successfully
- [ ] No parsing errors

### Network Interruption
- [ ] Start evaluation
- [ ] Disconnect internet briefly
- [ ] Reconnect
- [ ] Check if handled gracefully

### Multiple Tabs
- [ ] Open application in 2 browser tabs
- [ ] Submit from both tabs
- [ ] Both complete successfully
- [ ] No conflicts

---

## 📊 Performance Test

### Evaluation Speed
- [ ] Test 5 submissions
- [ ] Record time for each
- [ ] Average should be 5-15 seconds
- [ ] None should exceed 30 seconds

### Docker Resource Usage
```powershell
docker stats
```
- [ ] Backend RAM: <1GB
- [ ] Frontend RAM: <50MB
- [ ] CPU: <50% average
- [ ] No memory leaks over time

### Browser Performance
- [ ] Open DevTools (F12)
- [ ] Go to Performance tab
- [ ] Record while using app
- [ ] No significant lag
- [ ] No memory leaks

---

## ✅ Final Verification

### Documentation Check
- [ ] README.md updated
- [ ] DOCKER_DEPLOYMENT.md exists
- [ ] DOCKER_QUICK_START.md exists
- [ ] UPDATE_SUMMARY.md exists
- [ ] All docs are clear and helpful

### Code Quality
- [ ] No console.error in browser
- [ ] No lint errors in code
- [ ] Environment variables configured
- [ ] Docker files optimized

### Security Check
- [ ] No sensitive data in code
- [ ] Admin password changeable
- [ ] API endpoints validated
- [ ] CORS properly configured

### Deployment Ready
- [ ] Docker containers build successfully
- [ ] Health checks pass
- [ ] All features work
- [ ] Documentation complete
- [ ] Ready for production use

---

## 🎉 Success Criteria

All checkboxes above should be checked (✅) for complete success!

### Critical Items (Must Pass):
- Docker setup completes
- Expected screenshot shows/hides
- Evaluation completes in <30 seconds
- No backend crashes
- Admin panel works

### Nice to Have:
- All edge cases handled
- Performance metrics met
- Documentation thorough

---

## 📝 Test Results

**Date**: _____________
**Tester**: _____________

**Overall Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
1. _____________
2. _____________
3. _____________

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

**🎯 If all tests pass, you're ready to deploy!** 🚀
