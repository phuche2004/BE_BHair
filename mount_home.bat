@echo off
echo Disconnecting current Z: drive...
net use Z: /delete /y 2>nul

echo Mounting phone storage via LOCAL network (fast, home only)...
net use Z: \\172.16.10.245\PhoneStorage /user:root 1 /persistent:yes

echo.
echo Done! Z: drive mounted via LOCAL IP (172.16.10.245)
echo This only works at home (same WiFi)
pause
