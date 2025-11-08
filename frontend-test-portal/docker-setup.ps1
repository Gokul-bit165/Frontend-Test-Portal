# Docker Setup and Run Script for Windows
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   Frontend Test Portal - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "`nPlease install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop`n" -ForegroundColor White
    exit 1
}

# Check if Docker is running
Write-Host "`nChecking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again`n" -ForegroundColor Yellow
    exit 1
}

# Stop and remove old containers
Write-Host "`nCleaning up old containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build and start containers
Write-Host "`nBuilding Docker images..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes on first run...`n" -ForegroundColor Gray
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Failed to start containers!" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "`nWaiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker-compose ps

# Test backend health
Write-Host "`nTesting backend health..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$backendHealthy = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        $retryCount++
        Write-Host "   Retry $retryCount/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if ($backendHealthy) {
    Write-Host "[OK] Backend is healthy!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Backend health check failed (may still be starting)" -ForegroundColor Yellow
}

# Show access information
Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green

Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:5000/api" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop:          docker-compose stop" -ForegroundColor White
Write-Host "   Restart:       docker-compose restart" -ForegroundColor White
Write-Host "   Remove:        docker-compose down" -ForegroundColor White
Write-Host "   Remove + Data: docker-compose down -v`n" -ForegroundColor White

Write-Host "Tip: Screenshots and submissions are persisted in:" -ForegroundColor Yellow
Write-Host "   ./backend/screenshots/" -ForegroundColor Gray
Write-Host "   ./backend/data/`n" -ForegroundColor Gray
