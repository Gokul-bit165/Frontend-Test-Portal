# 🔒 Testing Restrictions Feature

The restrictions feature is now fully functional! Here's how to test it:

## Features Available

1. **Block Copy** - Prevents students from copying text during the test
2. **Block Paste** - Prevents students from pasting text during the test
3. **Force Fullscreen** - Requires students to stay in fullscreen mode
4. **Max Violations** - Auto-submit test after X violations (default: 3)

---

## How to Enable Restrictions

### Step 1: Login as Admin
- Go to http://localhost
- Login with admin credentials

### Step 2: Access Question Manager
- Click **"Courses"** tab
- Find **"HTML & CSS Basics"** course
- Click **"Manage Questions"** button

### Step 3: Configure Restrictions
- Click **"🔒 Manage Restrictions"** button (orange button at top)
- Enable the restrictions you want:
  - ✅ **Block Copy** - Checkbox
  - ✅ **Block Paste** - Checkbox
  - ✅ **Force Fullscreen** - Checkbox
  - 📝 **Max Violations** - Number input (1-10)

### Step 4: Save Settings
- Click **"Save Restrictions"** button
- You'll see a success message

---

## How to Test Restrictions

### Test as Student:

1. **Logout** from admin account
2. **Login as student**:
   - Username: `student1`
   - Password: `123456`

3. **Go to "My Courses"** and click on HTML & CSS course

4. **Start any level** (e.g., Level 1)

5. **You should see**:
   - Red box in header showing active restrictions
   - Violation counter (e.g., "Violations: 0/3")

6. **Try to trigger violations**:
   - **Block Copy Test**: Select some text and press `Ctrl+C` → Alert appears!
   - **Block Paste Test**: Press `Ctrl+V` → Alert appears!
   - **Fullscreen Test**: Press `F11` or `Esc` to exit fullscreen → Alert appears!

7. **Each violation increments the counter**

8. **After max violations** (e.g., 3):
   - Alert: "Maximum violations reached! Test will be submitted automatically."
   - All questions auto-submit (with current code or empty)
   - Automatically navigates to results page

---

## Visual Indicators

When restrictions are active, students will see:

```
┌─────────────────────────────────────┐
│ 🔒 Restrictions Active              │
│ • Copy blocked                      │
│ • Paste blocked                     │
│ • Fullscreen required               │
│ Violations: 2/3                     │
└─────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Block Copy Only
1. Enable only "Block Copy"
2. Set max violations to 3
3. As student, try copying code 3 times
4. On 3rd attempt, test auto-submits

### Scenario 2: Fullscreen Enforcement
1. Enable only "Force Fullscreen"
2. Set max violations to 2
3. As student, enter fullscreen (should auto-enter)
4. Press `Esc` or `F11` to exit → Violation!
5. Try again → Auto-submit!

### Scenario 3: All Restrictions
1. Enable all three restrictions
2. Set max violations to 5
3. As student:
   - Try copy → Violation 1
   - Try paste → Violation 2
   - Exit fullscreen → Violation 3
   - Try copy again → Violation 4
   - Try paste again → Violation 5
   - **Auto-submit and redirect to results**

### Scenario 4: No Restrictions
1. Disable all restrictions
2. As student, you can:
   - Copy freely
   - Paste freely
   - Work in normal window mode
   - No violation counter shown

---

## Backend API Endpoints

The restrictions are managed via these endpoints:

### Get Restrictions
```
GET /api/courses/:courseId/restrictions
```

### Update Restrictions
```
PUT /api/courses/:courseId/restrictions
Body: {
  blockCopy: true,
  blockPaste: true,
  forceFullscreen: true,
  maxViolations: 3
}
```

---

## Data Storage

Restrictions are stored in:
```
backend/data/courses.json
```

Example structure:
```json
{
  "id": "course-html-css",
  "name": "HTML & CSS Basics",
  "restrictions": {
    "blockCopy": true,
    "blockPaste": true,
    "forceFullscreen": false,
    "maxViolations": 3
  }
}
```

---

## Troubleshooting

### Issue: Restrictions not showing
**Solution**: 
- Clear browser cache (`Ctrl+Shift+Delete`)
- Hard refresh (`Ctrl+F5`)
- Check if restrictions are saved in `courses.json`

### Issue: Copy/Paste still works
**Solution**: 
- Verify restrictions are enabled in admin panel
- Check browser console for errors
- Ensure latest bundle is loaded (`index-CTcvnd8p.js`)

### Issue: Fullscreen not auto-entering
**Solution**: 
- Browser may block auto-fullscreen on first load
- Click anywhere on page first, then it will work
- Some browsers require user interaction before fullscreen

### Issue: Violation counter not incrementing
**Solution**: 
- Check browser console for JavaScript errors
- Verify event listeners are attached
- Try in Chrome/Edge (best support)

---

## Browser Compatibility

✅ **Fully Supported**:
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS)

⚠️ **Partial Support**:
- Safari (iOS) - Fullscreen may not work
- Mobile browsers - Copy/paste detection varies

---

## Notes

1. **Fullscreen Requirement**: 
   - System automatically requests fullscreen when enabled
   - Some browsers require user interaction first

2. **Violation Persistence**:
   - Violations are tracked per session
   - Reloading page resets violation counter
   - Consider adding server-side tracking for production

3. **Auto-Submit**:
   - Submits all questions with current code
   - Empty questions get 0 score
   - Redirects to results page automatically

4. **Admin Access**:
   - Restrictions don't apply to admin users
   - Only enforced on student-facing pages

---

## Next Steps

1. ✅ Enable restrictions in admin panel
2. ✅ Test each restriction type individually
3. ✅ Test combination of restrictions
4. ✅ Test max violations threshold
5. ✅ Verify auto-submit functionality
6. ✅ Test in different browsers

---

## Success Criteria

The feature is working correctly when:
- ✅ Admin can toggle restrictions on/off
- ✅ Students see restriction indicator
- ✅ Copy/Paste is blocked when enabled
- ✅ Fullscreen is enforced when enabled
- ✅ Violations are tracked and displayed
- ✅ Test auto-submits at max violations
- ✅ No restrictions when all disabled

---

**The restrictions feature is now live and ready to test! 🎉**
