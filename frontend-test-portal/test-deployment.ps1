# Test Deployment Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Testing Frontend Test Portal" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check if container is running
Write-Host "1. Checking Docker containers..." -ForegroundColor Yellow
$containers = docker ps --filter "name=test-portal" --format "{{.Names}}: {{.Status}}"
$containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }

# Test 2: Check backend logs
Write-Host "`n2. Checking backend health..." -ForegroundColor Yellow
docker logs test-portal-backend --tail 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

# Test 3: Check frontend API configuration
Write-Host "`n3. Verifying frontend API configuration..." -ForegroundColor Yellow
$localhostCount = docker exec test-portal-backend sh -c "cat /app/frontend/dist/assets/*.js | grep -o 'localhost:5000' | wc -l" 2>$null
Write-Host "   References to localhost:5000: $localhostCount" -ForegroundColor $(if ($localhostCount -eq "0") { "Green" } else { "Red" })

# Test 4: Test ngrok URL
Write-Host "`n4. Testing ngrok URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://naturalistic-barrenly-ernestina.ngrok-free.dev/health" `
        -Headers @{"ngrok-skip-browser-warning"="true"} `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   Health endpoint: " -NoNewline -ForegroundColor Green
    Write-Host "✓ $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "   Health endpoint: ✗ Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test API courses endpoint  
Write-Host "`n5. Testing API endpoints..." -ForegroundColor Yellow
try {
    $courses = Invoke-RestMethod -Uri "https://naturalistic-barrenly-ernestina.ngrok-free.dev/api/courses" `
        -Headers @{"ngrok-skip-browser-warning"="true"} `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   Courses API: " -NoNewline -ForegroundColor Green
    Write-Host "✓ Found $($courses.Count) courses" -ForegroundColor Green
} catch {
    Write-Host "   Courses API: ✗ Failed" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: https://naturalistic-barrenly-ernestina.ngrok-free.dev" -ForegroundColor White
Write-Host "2. Login with: student1 / 123456" -ForegroundColor White
Write-Host "3. Click 'Start Course' to test course loading`n" -ForegroundColor White
