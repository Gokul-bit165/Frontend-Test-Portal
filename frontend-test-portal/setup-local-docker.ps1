# =============================================================================
# Local Docker Setup Script
# This script sets up the application to run locally with Docker
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Local Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Set environment for local deployment
Write-Host "Setting up local environment..." -ForegroundColor Yellow
if (Test-Path .env) { Remove-Item .env }
Copy-Item .env.ngrok .env

# Update .env for local use
$envContent = Get-Content .env
$envContent = $envContent -replace 'DB_HOST=host.docker.internal', 'DB_HOST=mysql'
$envContent = $envContent -replace 'USE_JSON=.*', 'USE_JSON=false'
$envContent | Set-Content .env

# Build and start containers
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check status
Write-Host ""
Write-Host "Checking container status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now running:" -ForegroundColor White
Write-Host "  Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  MySQL:    localhost:3306" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor White
Write-Host "  Admin - Username: admin, Password: admin123" -ForegroundColor Yellow
Write-Host "  Student - Username: student1, Password: 123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host ""
