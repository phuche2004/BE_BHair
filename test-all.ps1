# Test All Endpoints
param([string]$url = "https://api.bhair.site")

Write-Host "Testing Backend: $url" -ForegroundColor Cyan
Write-Host ""

# Test 1: Root
Write-Host "1. Root endpoint..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod "$url/"
    Write-Host "   OK: $r" -ForegroundColor Green
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
}

# Test 2: Shops
Write-Host "2. Shops endpoint..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod "$url/api/v1/shop" -TimeoutSec 15
    Write-Host "   OK: Found $($r.Count) shops" -ForegroundColor Green
    if ($r.Count -gt 0) {
        Write-Host "   Shop 1: $($r[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Services
Write-Host "3. Services endpoint..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod "$url/api/v1/service" -TimeoutSec 15
    Write-Host "   OK: Found $($r.Count) services" -ForegroundColor Green
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Login
Write-Host "4. Login endpoint..." -ForegroundColor Yellow
$body = @{ phoneNumber = "0123456789"; password = "123456" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod "$url/api/v1/user/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 15
    Write-Host "   OK: Logged in as $($r.user.fullName)" -ForegroundColor Green
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
