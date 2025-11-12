# =============================================================================
# Complete Setup - One Command Solution
# =============================================================================

param(
    [switch]$Local,
    [switch]$Ngrok,
    [string]$BackendUrl,
    [string]$FrontendUrl
)

Write-Host @"
========================================
Frontend Test Portal - Complete Setup
========================================
"@ -ForegroundColor Cyan

if (-not $Local -and -not $Ngrok) {
    Write-Host @"
Please specify setup type:
  .\complete-setup.ps1 -Local              (Local Docker only)
  .\complete-setup.ps1 -Ngrok              (Local + Ngrok setup)

"@ -ForegroundColor Yellow
    exit 0
}

if ($Local) {
    Write-Host "Setting up LOCAL DOCKER deployment..." -ForegroundColor Green
    Write-Host ""
    
    # Stop existing
    docker-compose down
    
    # Setup local environment
    $envContent = @"
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=gokul
DB_NAME=frontend_test_portal
PORT=5000
USE_JSON=false
NODE_ENV=production
"@
    $envContent | Set-Content .env
    
    # Build and start
    Write-Host "Building images..." -ForegroundColor Yellow
    docker-compose build
    
    Write-Host "Starting services..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "Waiting for services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 25
    
    Write-Host @"

========================================
✅ LOCAL SETUP COMPLETE!
========================================

Access your application:
  🌐 Frontend: http://localhost
  🔧 Backend:  http://localhost:5000
  🗄️  MySQL:   localhost:3306

Login credentials:
  👤 Admin:   username: admin     password: admin123
  👨‍🎓 Student: username: student1  password: 123456
  👨‍🎓 Student: username: gokul     password: gokul

Commands:
  View logs:  docker-compose logs -f
  Stop all:   docker-compose down
  Restart:    docker-compose restart

"@ -ForegroundColor Green
}

if ($Ngrok) {
    Write-Host "Setting up NGROK deployment..." -ForegroundColor Green
    Write-Host ""
    
    # Check ngrok
    if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
        Write-Host "❌ ERROR: ngrok not found!" -ForegroundColor Red
        Write-Host "Install from: https://ngrok.com/download" -ForegroundColor Yellow
        exit 1
    }
    
    # Get URLs
    if (-not $BackendUrl) {
        Write-Host "Enter backend ngrok URL (e.g., https://abc.ngrok-free.dev):" -ForegroundColor Yellow
        $BackendUrl = Read-Host
    }
    
    if (-not $FrontendUrl) {
        $FrontendUrl = $BackendUrl
    }
    
    $BackendUrl = $BackendUrl.TrimEnd('/')
    $FrontendUrl = $FrontendUrl.TrimEnd('/')
    
    Write-Host "Backend URL:  $BackendUrl" -ForegroundColor Cyan
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Stop existing
    docker-compose down
    
    # Setup environment
    $envContent = @"
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=gokul
DB_NAME=frontend_test_portal
PORT=5000
USE_JSON=false
NODE_ENV=production
NGROK_BACKEND_URL=$BackendUrl
NGROK_FRONTEND_URL=$FrontendUrl
"@
    $envContent | Set-Content .env
    
    # Frontend env
    "VITE_API_URL=$BackendUrl/api" | Set-Content frontend\.env.production
    
    # Build with API URL
    Write-Host "Building with ngrok configuration..." -ForegroundColor Yellow
    $env:VITE_API_URL = "$BackendUrl/api"
    docker-compose build --build-arg VITE_API_URL="$BackendUrl/api"
    
    # Start
    Write-Host "Starting services..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "Waiting for services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 25
    
    Write-Host @"

========================================
✅ NGROK SETUP COMPLETE!
========================================

⚠️  IMPORTANT: Start ngrok tunnels NOW!
Open TWO separate terminals:

Terminal 1 (Backend):
  ngrok http 5000

Terminal 2 (Frontend):
  ngrok http 80

Local Access:
  🌐 Frontend: http://localhost
  🔧 Backend:  http://localhost:5000

Global Access (via ngrok):
  🌐 Frontend: $FrontendUrl
  🔧 Backend:  $BackendUrl

Login credentials:
  👤 Admin:   username: admin     password: admin123
  👨‍🎓 Student: username: student1  password: 123456
  👨‍🎓 Student: username: gokul     password: gokul

Share with friends: $FrontendUrl

"@ -ForegroundColor Green
}

docker-compose ps
