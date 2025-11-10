# MySQL Database Setup Script for Windows
# Run this in PowerShell

Write-Host "🗄️  MySQL Database Setup for Frontend Test Portal" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if ($null -eq $mysqlPath) {
    Write-Host "❌ MySQL not found in PATH" -ForegroundColor Red
    Write-Host "Please install MySQL from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL found: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Check if MySQL service is running
Write-Host "Checking MySQL service..." -ForegroundColor Yellow
$service = Get-Service -Name MySQL* -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq 'Running'} | Select-Object -First 1

if ($null -eq $service) {
    Write-Host "❌ MySQL service is not running" -ForegroundColor Red
    Write-Host "Starting MySQL service..." -ForegroundColor Yellow
    
    $allServices = Get-Service -Name MySQL* -ErrorAction SilentlyContinue
    if ($allServices.Count -gt 0) {
        $serviceName = $allServices[0].Name
        try {
            Start-Service -Name $serviceName
            Write-Host "✅ MySQL service started" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start MySQL. Please start it manually or run as Administrator" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ No MySQL service found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ MySQL service is running: $($service.Name)" -ForegroundColor Green
}
Write-Host ""

# Get database credentials
Write-Host "Database Configuration" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

$dbUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbPassword = Read-Host "Enter MySQL password (leave empty if no password)" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow

# Create database using schema file
$schemaPath = Join-Path $PSScriptRoot "backend\database\schema.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Host "❌ Schema file not found: $schemaPath" -ForegroundColor Red
    exit 1
}

# Execute MySQL command
$mysqlCmd = "mysql -u $dbUser"
if (-not [string]::IsNullOrWhiteSpace($dbPasswordPlain)) {
    $mysqlCmd += " -p$dbPasswordPlain"
}
$mysqlCmd += " < `"$schemaPath`""

try {
    Invoke-Expression $mysqlCmd 2>&1 | Out-Null
    Write-Host "✅ Database created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Yellow

# Update .env file
$envPath = Join-Path $PSScriptRoot "backend\.env"
$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_USER=$dbUser
DB_PASSWORD=$dbPasswordPlain
DB_NAME=frontend_test_portal

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=frontend-test-portal-secret-key-2025
"@

Set-Content -Path $envPath -Value $envContent
Write-Host "✅ .env file updated" -ForegroundColor Green

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "backend")
npm install mysql2 dotenv --save 2>&1 | Out-Null
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Yellow
npm run migrate

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ MySQL Database Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend server: npm run dev" -ForegroundColor White
Write-Host "2. Access admin dashboard: http://localhost/admin/login" -ForegroundColor White
Write-Host "3. Login with: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Database connection info:" -ForegroundColor Yellow
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Database: frontend_test_portal" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host ""
