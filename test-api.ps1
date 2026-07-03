# Quick API Test
param([string]$url = "https://api.bhair.site")

Write-Host "Testing: $url" -ForegroundColor Cyan

# Test root
try {
    $r = Invoke-RestMethod "$url/" -TimeoutSec 10
    Write-Host "✅ Root: $r" -ForegroundColor Green
} catch {
    Write-Host "❌ Root failed" -ForegroundColor Red
}

# Test shops
try {
    $r = Invoke-RestMethod "$url/api/v1/shop" -TimeoutSec 15
    Write-Host "✅ Shops: $($r.Count) found" -ForegroundColor Green
} catch {
    Write-Host "❌ Shops failed: $($_.Exception.Message)" -ForegroundColor Red
}
