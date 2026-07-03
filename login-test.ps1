# Test Login API
param(
    [string]$url = "https://api.bhair.site",
    [string]$phone = "0123456789",
    [string]$pass = "123456"
)

$body = @{
    phoneNumber = $phone
    password = $pass
} | ConvertTo-Json

Write-Host "Testing login: $phone" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$url/api/v1/user/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0,50))..." -ForegroundColor Yellow
    Write-Host "User: $($response.user.fullName) - Role: $($response.user.role)" -ForegroundColor Yellow
    
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
