# Test Login Script cho B_Hair Backend
# Sử dụng: .\test-login.ps1

param(
    [string]$BaseUrl = "https://api.bhair.site",
    [string]$PhoneNumber = "0123456789",
    [string]$Password = "123456"
)

Write-Host "🔐 Testing Login API..." -ForegroundColor Cyan
Write-Host "URL: $BaseUrl/api/v1/user/login" -ForegroundColor Gray
Write-Host "Phone: $PhoneNumber" -ForegroundColor Gray

$body = @{
    phoneNumber = $PhoneNumber
    password = $Password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/user/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "✅ Login Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token:" -ForegroundColor Yellow
    Write-Host $response.token
    Write-Host ""
    Write-Host "User Info:" -ForegroundColor Yellow
    $response.user | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Login Failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
