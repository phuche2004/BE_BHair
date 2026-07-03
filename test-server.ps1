# Test Server Health Script
# Sử dụng: .\test-server.ps1

param(
    [string]$BaseUrl = "https://api.bhair.site"
)

Write-Host "🏥 Testing Server Health..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Root endpoint
Write-Host "1️⃣  Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/" -Method Get -TimeoutSec 10
    Write-Host "✅ Root: $response" -ForegroundColor Green
} catch {
    Write-Host "❌ Root failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if server responds
Write-Host "2️⃣  Testing API response time..." -ForegroundColor Yellow
try {
    $start = Get-Date
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -Method Get -TimeoutSec 10
    $end = Get-Date
    $duration = ($end - $start).TotalMilliseconds
    Write-Host "✅ Response time: $([math]::Round($duration, 2))ms" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server not responding" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test a simple GET endpoint (shops)
Write-Host "3️⃣  Testing shops endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/shop" -Method Get -TimeoutSec 15
    Write-Host "✅ Shops endpoint working" -ForegroundColor Green
    Write-Host "   Found $($response.Count) shops" -ForegroundColor Gray
} catch {
    Write-Host "❌ Shops endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Server URL: $BaseUrl" -ForegroundColor Gray
Write-Host "   Use test-login.ps1 to test authentication" -ForegroundColor Gray
