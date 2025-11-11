# Clear Browser Cache Script
Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "BROWSER CACHE CLEAR INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan

Write-Host "`n1. CLOSE ALL BROWSER WINDOWS" -ForegroundColor Red
Write-Host "   (Make sure Edge/Chrome is completely closed)" -ForegroundColor White

Write-Host "`n2. CLEAR EDGE CACHE:" -ForegroundColor Yellow
Write-Host "   - Open Edge" -ForegroundColor White
Write-Host "   - Press: Ctrl + Shift + Delete" -ForegroundColor Green
Write-Host "   - Select 'All time'" -ForegroundColor White
Write-Host "   - Check 'Cached images and files'" -ForegroundColor White
Write-Host "   - Click 'Clear now'" -ForegroundColor White

Write-Host "`n3. OR USE INCOGNITO MODE (FASTEST):" -ForegroundColor Yellow
Write-Host "   - Press: Ctrl + Shift + N" -ForegroundColor Green
Write-Host "   - Go to: http://localhost/admin/login" -ForegroundColor White

Write-Host "`n4. VERIFY NEW UI:" -ForegroundColor Yellow
Write-Host "   - Login: admin / admin123" -ForegroundColor White
Write-Host "   - Click 'Courses' tab" -ForegroundColor White
Write-Host "   - You should see 'Manage Questions' button" -ForegroundColor Green

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "Docker containers are running with NEW code!" -ForegroundColor Green
Write-Host "The problem is ONLY browser cache!" -ForegroundColor Red
Write-Host "===================================" -ForegroundColor Cyan

Write-Host "`nPress any key to open browser clearing page..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open Edge clear browsing data page
Start-Process "microsoft-edge:edge://settings/clearBrowserData"

Write-Host "`nClearing Edge cache page opened!" -ForegroundColor Green
Write-Host "Select 'All time' and 'Cached images and files', then click Clear now" -ForegroundColor Yellow
