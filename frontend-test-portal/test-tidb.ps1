# Test TiDB Connection Script
Write-Host "Testing TiDB Cloud Connection..." -ForegroundColor Cyan

# Test port 4000
$result = Test-NetConnection -ComputerName gateway01.ap-southeast-1.prod.aws.tidbcloud.com -Port 4000

if ($result.TcpTestSucceeded) {
    Write-Host "✅ SUCCESS: Port 4000 is now accessible!" -ForegroundColor Green
    Write-Host "You can now switch to TiDB configuration." -ForegroundColor Green
} else {
    Write-Host "❌ FAILED: Port 4000 is still blocked" -ForegroundColor Red
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  1. Connect to a VPN" -ForegroundColor Yellow
    Write-Host "  2. Use mobile hotspot" -ForegroundColor Yellow
    Write-Host "  3. Contact ISP to unblock port 4000" -ForegroundColor Yellow
}

Write-Host "`nConnection Details:" -ForegroundColor Cyan
$result | Format-List ComputerName, RemoteAddress, RemotePort, TcpTestSucceeded, PingSucceeded
