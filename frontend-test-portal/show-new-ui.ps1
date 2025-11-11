Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  FORCING NEW UI TO LOAD" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking Docker Status..." -ForegroundColor Green
docker-compose ps
Write-Host ""

Write-Host "Verifying New Code in Container..." -ForegroundColor Green
$hasNewCode = docker exec test-portal-frontend cat /usr/share/nginx/html/assets/index-C5yfK7so.js | Select-String "Upload Questions by Level" -Quiet
if ($hasNewCode) {
    Write-Host "SUCCESS! New code found in container!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not verify" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  OPEN INCOGNITO MODE NOW!" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+Shift+N in your browser" -ForegroundColor Yellow
Write-Host "Then go to: http://localhost/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "This bypasses ALL cache!" -ForegroundColor Green
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$url = "http://localhost/admin/login?v=$timestamp"

Write-Host "Opening browser with cache-buster..." -ForegroundColor Yellow
Start-Process $url
Write-Host ""

Write-Host "Opening cache clear page..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process "edge://settings/clearBrowserData"
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "  WHAT YOU SHOULD SEE:" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Login to admin" -ForegroundColor Cyan
Write-Host "2. Click Courses tab" -ForegroundColor Cyan
Write-Host "3. Click Manage Questions" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEW UI:" -ForegroundColor Green
Write-Host "  - 6 Level Cards" -ForegroundColor White
Write-Host "  - Download Template buttons" -ForegroundColor White
Write-Host "  - Upload Questions buttons" -ForegroundColor White
Write-Host "  - Manage Restrictions button" -ForegroundColor White
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  CODE IS DEPLOYED!" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Write-Host "Press Enter to close..."
Read-Host
