# Docker Logs Viewer
param(
    [string]$Service = "",
    [switch]$Follow = $false
)

if ($Service -eq "") {
    Write-Host "`n📋 Showing logs for all services..." -ForegroundColor Cyan
    if ($Follow) {
        docker-compose logs -f
    } else {
        docker-compose logs --tail=100
    }
} else {
    Write-Host "`n📋 Showing logs for $Service..." -ForegroundColor Cyan
    if ($Follow) {
        docker-compose logs -f $Service
    } else {
        docker-compose logs --tail=100 $Service
    }
}
