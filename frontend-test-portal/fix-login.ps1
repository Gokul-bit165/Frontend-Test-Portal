# Quick Fix for Login Issues
# Run this if you're having login problems

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Login Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
$containers = docker ps --format "{{.Names}}" | Select-String -Pattern "test-portal"
if (-not $containers) {
    Write-Host "❌ Containers not running! Starting them..." -ForegroundColor Red
    docker-compose up -d
    Start-Sleep -Seconds 20
}

Write-Host "✅ Containers running" -ForegroundColor Green
Write-Host ""

# Add/Update gokul user
Write-Host "Adding/updating user 'gokul' with password 'gokul'..." -ForegroundColor Yellow

# Hash for password "gokul" using sha256
$gokulPasswordHash = "923ca9b6c0e99b06d18c5d44bc8e5e6c707b3adcf4bfba79aa1c1ac89c12ddfc"

# Create user in JSON
$usersJsonPath = "backend\data\users.json"
if (Test-Path $usersJsonPath) {
    $users = Get-Content $usersJsonPath | ConvertFrom-Json
    $gokulUser = $users | Where-Object { $_.username -eq "gokul" }
    
    if (-not $gokulUser) {
        Write-Host "Creating new user 'gokul'..." -ForegroundColor Yellow
        $newUser = @{
            id = "user-gokul-" + [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
            username = "gokul"
            password = $gokulPasswordHash
            email = "gokul@example.com"
            fullName = "Gokul"
            role = "student"
            createdAt = (Get-Date -Format "o")
            lastLogin = $null
        }
        $users += $newUser
        $users | ConvertTo-Json -Depth 10 | Set-Content $usersJsonPath
        Write-Host "✅ User 'gokul' created" -ForegroundColor Green
    } else {
        Write-Host "✅ User 'gokul' already exists" -ForegroundColor Green
    }
}

# Also try to add to database
Write-Host ""
Write-Host "Adding user to MySQL database..." -ForegroundColor Yellow
$sqlCommand = @"
INSERT INTO users (id, username, password, email, full_name, role, created_at) 
VALUES ('user-gokul-manual', 'gokul', '$gokulPasswordHash', 'gokul@example.com', 'Gokul', 'student', NOW())
ON DUPLICATE KEY UPDATE password='$gokulPasswordHash';
"@

docker exec test-portal-mysql mysql -u root -pgokul frontend_test_portal -e $sqlCommand 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ User added to database" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database update skipped (might not be using MySQL)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Login Fix Applied!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Try these credentials:" -ForegroundColor White
Write-Host "  Username: gokul" -ForegroundColor Cyan
Write-Host "  Password: gokul" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use:" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor Cyan
Write-Host "  Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Username: student1" -ForegroundColor Cyan
Write-Host "  Password: 123456" -ForegroundColor Cyan
Write-Host ""

# Check backend logs for errors
Write-Host "Recent backend logs:" -ForegroundColor Yellow
docker logs --tail 20 test-portal-backend

Write-Host ""
Write-Host "If still having issues, restart containers:" -ForegroundColor Gray
Write-Host "  docker-compose restart" -ForegroundColor Gray
Write-Host ""
