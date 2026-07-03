# Script đổi DNS sang Cloudflare 1.1.1.1
Write-Host "Đang đổi DNS sang Cloudflare 1.1.1.1..." -ForegroundColor Cyan

# Lấy tên adapter Wi-Fi
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.Name -like '*Wi-Fi*'} | Select-Object -First 1

if ($adapter) {
    Write-Host "Tìm thấy adapter: $($adapter.Name)" -ForegroundColor Green
    
    # Đổi DNS
    Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("1.1.1.1","1.0.0.1")
    
    # Flush DNS cache
    ipconfig /flushdns | Out-Null
    
    Write-Host "`nĐã đổi DNS thành công!" -ForegroundColor Green
    Write-Host "Primary DNS: 1.1.1.1" -ForegroundColor Yellow
    Write-Host "Alternate DNS: 1.0.0.1" -ForegroundColor Yellow
    
    # Hiển thị DNS hiện tại
    Write-Host "`nDNS hiện tại:" -ForegroundColor Cyan
    Get-DnsClientServerAddress -InterfaceAlias $adapter.Name -AddressFamily IPv4
    
} else {
    Write-Host "Không tìm thấy adapter Wi-Fi!" -ForegroundColor Red
}

Write-Host "`nNhấn phím bất kỳ để đóng..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
