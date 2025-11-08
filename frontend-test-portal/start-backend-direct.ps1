# Start Backend Server Script
Write-Host "`n🚀 Starting Backend Server..." -ForegroundColor Cyan

$backendPath = "C:\Users\gokul\htmlcss-code-executor\frontend-test-portal\backend"

# Check if directory exists
if (-Not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
Set-Location $backendPath
Write-Host "📁 Location: $(Get-Location)" -ForegroundColor Gray

# Check if server.js exists
if (-Not (Test-Path "server.js")) {
    Write-Host "❌ server.js not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found server.js" -ForegroundColor Green
Write-Host "`n🔄 Starting server with node..." -ForegroundColor Yellow

# Start server
node server.js
