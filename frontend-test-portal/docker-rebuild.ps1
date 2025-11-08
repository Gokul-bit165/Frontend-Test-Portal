# Docker Rebuild Script - Use when you make code changes
Write-Host "`n🔄 Rebuilding Docker containers..." -ForegroundColor Cyan

# Stop containers
Write-Host "`n🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose stop

# Rebuild
Write-Host "`n🔨 Rebuilding images..." -ForegroundColor Yellow
docker-compose build

# Restart
Write-Host "`n🚀 Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n✅ Rebuild complete!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000`n" -ForegroundColor White
