# Backend Server Restart Script
# Use this if evaluation endpoint not responding

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESTARTING BACKEND SERVER" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Find and stop backend Node process on port 5000
Write-Host "🔍 Finding backend process on port 5000..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $port = (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 5000}).LocalPort
    $port -eq 5000
}

if ($backendProcess) {
    Write-Host "✅ Found backend process (ID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host "⏹️  Stopping backend server..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Backend stopped successfully`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  No backend process found on port 5000" -ForegroundColor Yellow
    Write-Host "   Server might not be running`n" -ForegroundColor Gray
}

# Navigate to backend directory
Write-Host "📁 Navigating to backend directory..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "✅ In directory: $backendPath`n" -ForegroundColor Green
} else {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    Write-Host "   Expected: $backendPath`n" -ForegroundColor Gray
    exit 1
}

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "   Are you in the correct directory?`n" -ForegroundColor Gray
    exit 1
}

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
Write-Host "   Running: npm run dev`n" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend server will start below" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# Run npm dev (this will keep running)
npm run dev
