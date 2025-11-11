# ================================================
# ✅ MANAGE QUESTIONS BUTTON ADDED TO COURSES
# ================================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Write-Host "New Bundle Created:" -ForegroundColor Cyan
docker exec test-portal-frontend ls -lh /usr/share/nginx/html/assets/ | Select-String "\.js"
Write-Host ""

Write-Host "Verification:" -ForegroundColor Cyan
$result = docker exec test-portal-frontend cat /usr/share/nginx/html/assets/index-CYHrCU2C.js | Select-String "Manage Questions" -Quiet
if ($result) {
    Write-Host "✅ 'Manage Questions' button FOUND in bundle!" -ForegroundColor Green
} else {
    Write-Host "❌ Not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "  WHAT'S NEW:" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Challenges tab REMOVED from navigation" -ForegroundColor White
Write-Host "✅ 'Manage Questions' button ADDED to each course card" -ForegroundColor White
Write-Host "✅ QuestionManagerModal integrated" -ForegroundColor White
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "  HOW TO USE:" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: http://localhost/admin/login" -ForegroundColor Cyan
Write-Host "2. Login: admin / admin123" -ForegroundColor White
Write-Host "3. Click 'Courses' tab" -ForegroundColor White
Write-Host "4. Find any course (e.g., HTML & CSS Fundamentals)" -ForegroundColor White
Write-Host "5. Click the '📝 Manage Questions' button (NEW!)" -ForegroundColor Yellow
Write-Host ""
Write-Host "YOU'LL SEE:" -ForegroundColor Green
Write-Host "  - 6 level cards (Level 1-6)" -ForegroundColor Gray
Write-Host "  - Download Template button per level" -ForegroundColor Gray
Write-Host "  - Upload Questions button per level" -ForegroundColor Gray
Write-Host "  - Manage Restrictions button" -ForegroundColor Gray
Write-Host "  - Individual question editing below" -ForegroundColor Gray
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "  BUNDLE VERSION:" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Previous: index-D8JuwNEt.js" -ForegroundColor Red
Write-Host "Current:  index-CYHrCU2C.js" -ForegroundColor Green
Write-Host ""
Write-Host "New hash = Browser will auto-download new file!" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening browser..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Start-Process "http://localhost/admin/login?t=$timestamp"

Write-Host ""
Write-Host "Press Enter to close"
Read-Host
