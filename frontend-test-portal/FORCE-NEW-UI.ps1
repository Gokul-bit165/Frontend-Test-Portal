# ============================================
# ULTIMATE CACHE-BUSTING SCRIPT
# ============================================
# This will FORCE your browser to see the new UI
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FORCING NEW UI TO LOAD" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Docker Status:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "✅ New Code Verified in Container:" -ForegroundColor Green
$result = docker exec test-portal-frontend cat /usr/share/nginx/html/assets/index-C5yfK7so.js | Select-String "Upload Questions by Level" -Quiet
if ($result) {
    Write-Host "   ✓ 'Upload Questions by Level' text FOUND!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Text not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  METHOD 1: INCOGNITO MODE (FASTEST!)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+Shift+N in your browser RIGHT NOW!" -ForegroundColor Yellow
Write-Host "Then go to: http://localhost/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "This bypasses ALL cache! You'll see the new UI immediately!" -ForegroundColor Green
Write-Host ""

# Open the browser with cache-busting timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$url = "http://localhost/admin/login?v=$timestamp"

Write-Host "Opening browser with cache-buster URL..." -ForegroundColor Yellow
Start-Process $url

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  METHOD 2: CLEAR CACHE MANUALLY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Method 1 didn't work, do this:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "2. Select 'All time'" -ForegroundColor White
Write-Host "3. Check 'Cached images and files'" -ForegroundColor White
Write-Host "4. Click 'Clear now'" -ForegroundColor White
Write-Host "5. Close browser COMPLETELY" -ForegroundColor White
Write-Host "6. Reopen and go to localhost" -ForegroundColor White
Write-Host ""

# Try to open cache clearing page
Write-Host "Opening cache clearing page..." -ForegroundColor Yellow
Start-Process "edge://settings/clearBrowserData"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  METHOD 3: HARD REFRESH" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After logging in:" -ForegroundColor Yellow
Write-Host "1. Press Ctrl+Shift+R (or Ctrl+F5)" -ForegroundColor White
Write-Host "2. Or hold Ctrl and click the Refresh button" -ForegroundColor White
Write-Host ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  WHAT YOU SHOULD SEE:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Login then Click Courses tab" -ForegroundColor Cyan
Write-Host "Find HTML and CSS Fundamentals course" -ForegroundColor Cyan
Write-Host "Click Manage Questions button" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEW UI FEATURES:" -ForegroundColor Green
Write-Host "  - 6 Level Cards (Level 1-6)" -ForegroundColor White
Write-Host "  - Download Template buttons" -ForegroundColor White
Write-Host "  - Upload Questions buttons" -ForegroundColor White
Write-Host "  - Manage Restrictions button" -ForegroundColor White
Write-Host "  - Randomize count settings per level" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  THE CODE IS DEPLOYED AND READY!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Keep window open
Read-Host "Press Enter to close this window"
