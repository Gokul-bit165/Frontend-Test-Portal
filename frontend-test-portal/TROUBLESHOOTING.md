# 🔧 Troubleshooting Guide

This guide helps you resolve common issues with the Frontend Test Portal.

---

## 📋 Quick Diagnostics

### Error: "Failed to submit solution"

**Symptoms:**
- Alert appears when clicking "Submit & Evaluate"
- Submission doesn't go through
- Console shows network errors

**Common Causes & Solutions:**

#### 1. Backend Server Not Running ⚠️

**Check:**
```powershell
# Test if backend is accessible
Test-NetConnection -ComputerName localhost -Port 5000
```

**Solution:**
```powershell
cd frontend-test-portal\backend
npm run dev
```

**Expected Output:**
```
[nodemon] starting `node server.js`
Server running on http://localhost:5000
Available endpoints:
   GET  /health
   GET  /api/challenges
   ...
```

---

#### 2. CORS Issues 🌐

**Symptoms:**
- Browser console shows: "Access-Control-Allow-Origin" error
- Network tab shows "CORS policy" blocked

**Check Backend CORS Configuration:**
```javascript
// backend/server.js should have:
app.use(cors());
```

**Quick Fix:**
```powershell
cd frontend-test-portal\backend
# Stop server (Ctrl+C) and restart
npm run dev
```

---

#### 3. Frontend Not Proxying Correctly 🔄

**Check Vite Config:**
```javascript
// frontend/vite.config.js should have:
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

**Solution:**
```powershell
cd frontend-test-portal\frontend
# Stop server (Ctrl+C) and restart
npm run dev
```

---

#### 4. Port Conflicts 🔌

**Check if ports are in use:**
```powershell
# Check backend port
netstat -ano | findstr :5000

# Check frontend port
netstat -ano | findstr :5173
```

**Solution - Kill existing processes:**
```powershell
# Find process ID (PID) from above command
# Then kill it:
Stop-Process -Id <PID> -Force

# Or change ports:
# Backend: set PORT=5001 in environment
# Frontend: Change port in vite.config.js
```

---

#### 5. Missing Dependencies 📦

**Symptoms:**
- Server crashes on startup
- "Cannot find module" errors

**Solution:**
```powershell
# Backend
cd frontend-test-portal\backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd ..\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

#### 6. File Permission Issues 🔒

**Symptoms:**
- "EACCES" or "EPERM" errors
- Can't write to submissions.json

**Check File Permissions:**
```powershell
# Check if files are read-only
Get-ChildItem -Path "backend\data" -Recurse | Select-Object Name, IsReadOnly

# Make writable
Get-ChildItem -Path "backend\data" -Recurse | ForEach-Object { $_.IsReadOnly = $false }
```

---

#### 7. JSON File Corruption 🗂️

**Symptoms:**
- "Unexpected token" in JSON
- Server crashes when reading data files

**Solution - Reset Data Files:**
```powershell
cd frontend-test-portal\backend\data

# Backup existing
Copy-Item submissions.json submissions.backup.json

# Reset to empty array
echo "[]" > submissions.json
```

**Or restore from backup:**
```powershell
# If you have git
git checkout backend/data/submissions.json
```

---

## 🔍 Detailed Error Analysis

### Browser Console Errors

#### "Network Error" / "ERR_CONNECTION_REFUSED"

**Diagnosis:**
Backend server is not running or not accessible.

**Steps:**
1. Check backend terminal - should show "Server running"
2. Open http://localhost:5000/health in browser
3. Should see: `{"status":"OK","message":"Server is running"}`
4. If not working, restart backend server

---

#### "404 Not Found" on /api/submissions

**Diagnosis:**
Route not properly registered or wrong endpoint.

**Check:**
```javascript
// backend/server.js should have:
app.use('/api/submissions', submissionsRouter);
```

**Verify Route File:**
```powershell
# Check if file exists
Test-Path backend\routes\submissions.js
```

---

#### "500 Internal Server Error"

**Diagnosis:**
Backend code error.

**Check Backend Logs:**
Look at the backend terminal for error stack traces.

**Common Causes:**
- Missing data files
- JSON parsing errors
- File system permission issues

**Debug Mode:**
```powershell
cd backend
$env:DEBUG="*"
npm run dev
```

---

### Submission-Specific Issues

#### Submission Saves But Doesn't Evaluate

**Check submissions.json:**
```powershell
Get-Content backend\data\submissions.json | ConvertFrom-Json | Format-Table id, status, evaluatedAt
```

**If status is "pending":**

1. **Check Evaluation Route:**
```powershell
# Test evaluation endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/evaluate" -Method POST -ContentType "application/json" -Body '{"submissionId":"<ID>"}'
```

2. **Check Puppeteer Installation:**
```powershell
cd backend
npm list puppeteer
# Should show installed version
```

3. **Reinstall Puppeteer:**
```powershell
npm uninstall puppeteer
npm install puppeteer
```

---

#### Evaluation Takes Too Long / Times Out

**Symptoms:**
- "Evaluating..." never completes
- No error message shown

**Causes:**
- Puppeteer can't launch Chrome
- Screenshot directory missing
- Memory issues

**Solutions:**

1. **Check Chrome Installation:**
```powershell
# Puppeteer needs Chrome/Chromium
Get-Command chrome -ErrorAction SilentlyContinue
```

2. **Check Screenshot Directory:**
```powershell
# Should exist and be writable
Test-Path backend\screenshots
New-Item -ItemType Directory -Force -Path backend\screenshots
```

3. **Check Memory:**
```powershell
# Task Manager > Performance > Memory
# Need at least 2GB free
```

4. **Increase Timeout:**
Edit `backend/services/pixelMatch.js`:
```javascript
// Line with timeout
await page.goto(..., { waitUntil: 'networkidle0', timeout: 30000 }); // Increase from 10000 to 30000
```

---

## 🛠️ Advanced Debugging

### Enable Verbose Logging

**Backend (server.js):**
```javascript
// Add after middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});
```

**Frontend (api.js):**
```javascript
// Add response interceptor
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

---

### Test API Manually

**Using PowerShell:**
```powershell
# Test GET challenges
Invoke-RestMethod -Uri "http://localhost:5000/api/challenges" -Method GET

# Test POST submission
$body = @{
  challengeId = "ch-001"
  candidateName = "Test User"
  code = @{
    html = "<h1>Test</h1>"
    css = "h1 { color: red; }"
    js = ""
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/submissions" -Method POST -ContentType "application/json" -Body $body
```

**Using Browser:**
1. Open http://localhost:5000/health
2. Should see OK status
3. Open http://localhost:5000/api/challenges
4. Should see JSON array of challenges

---

### Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Submit & Evaluate"
4. Watch for API calls:
   - POST /api/submissions → Should return 201 Created
   - POST /api/evaluate → Should return 200 OK
   - GET /api/submissions/:id/result → Should eventually return result

**Red Request = Problem:**
- Click on it
- Check "Response" tab for error message
- Check "Headers" tab for status code

---

## 🔄 Complete Reset Procedure

If nothing works, start fresh:

```powershell
# 1. Stop all servers (Ctrl+C in both terminals)

# 2. Clean backend
cd frontend-test-portal\backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install

# 3. Clean frontend
cd ..\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install

# 4. Reset data
cd ..\backend\data
echo "[]" > submissions.json

# 5. Restart backend
cd ..
npm run dev

# 6. Restart frontend (new terminal)
cd ..\frontend
npm run dev

# 7. Clear browser cache
# In browser: Ctrl+Shift+Delete > Clear cache

# 8. Test again
```

---

## 📞 Still Not Working?

### Collect Debug Information

```powershell
# System info
node --version
npm --version
$PSVersionTable.PSVersion

# Port status
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Backend status
Test-NetConnection -ComputerName localhost -Port 5000

# Check logs
Get-Content backend\data\submissions.json

# Check file structure
tree /F frontend-test-portal
```

### Common Error Messages Decoded

| Error | Meaning | Solution |
|-------|---------|----------|
| `ECONNREFUSED` | Backend not running | Start backend server |
| `CORS policy` | Cross-origin blocked | Check CORS middleware |
| `404 Not Found` | Wrong endpoint | Verify route registration |
| `500 Internal` | Server error | Check backend logs |
| `EACCES` | Permission denied | Check file permissions |
| `ENOENT` | File not found | Check file paths |
| `SyntaxError` | Invalid JSON | Check JSON files |
| `ERR_NAME_NOT_RESOLVED` | DNS issue | Use localhost, not 127.0.0.1 |

---

## ✅ Verification Checklist

Use this to confirm everything is working:

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] http://localhost:5000/health returns OK
- [ ] http://localhost:5000/api/challenges returns JSON
- [ ] http://localhost:5173 loads the app
- [ ] Browser console has no errors
- [ ] Can see challenges on homepage
- [ ] Can click and open a challenge
- [ ] Code editor loads and is editable
- [ ] Preview updates when clicking "Run Code"
- [ ] Name modal appears when clicking "Submit"
- [ ] Submission goes through without alert
- [ ] "Evaluating..." message appears
- [ ] Results display after a few seconds

---

## 🎯 Specific Error Solutions

### "Failed to submit solution. Please try again."

This is the generic error message. To see the real error:

1. **Open Browser Console (F12)**
2. **Go to Console tab**
3. **Look for red error messages**
4. **Click "Submit" again**
5. **Read the detailed error**

Common specific errors:

**"Network Error"** → Backend not running
**"timeout of 5000ms exceeded"** → Backend slow/crashed
**"Request failed with status code 400"** → Invalid data sent
**"Request failed with status code 500"** → Backend code error

---

### Windows-Specific Issues

#### Windows Defender Blocking

Windows Defender might block Node.js or Chrome processes.

**Solution:**
```powershell
# Run PowerShell as Administrator
Add-MpPreference -ExclusionPath "C:\Users\gokul\htmlcss-code-executor\frontend-test-portal"
```

#### Path Length Issues

Windows has 260 character path limit.

**Solution:**
- Move project closer to C:\ drive root
- Or enable long paths:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

---

## 🔬 Debug Mode Quick Start

```powershell
# Backend with debug logs
cd backend
$env:DEBUG="*"
$env:NODE_ENV="development"
npm run dev

# Frontend with source maps
cd frontend
npm run dev -- --debug
```

---

**Last Updated**: November 8, 2025
**Version**: 1.0

Need more help? Check the other documentation files:
- **QUICKSTART.md** - Setup instructions
- **README.md** - Project overview
- **ARCHITECTURE.md** - System design
- **API.md** - API reference
