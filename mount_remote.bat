@echo off
echo Disconnecting current Z: drive...
net use Z: /delete /y 2>nul

echo Mounting phone storage via TAILSCALE VPN (works anywhere)...
net use Z: \\100.91.43.5\PhoneStorage /user:root 1 /persistent:yes

echo.
echo Done! Z: drive mounted via TAILSCALE IP (100.91.43.5)
echo This works anywhere with internet connection
pause
