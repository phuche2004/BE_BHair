#!/bin/bash
echo "=== 1. Kiểm tra PM2 Status ==="
pm2 list

echo ""
echo "=== 2. Kiểm tra Tunnel Logs ==="
pm2 logs tunnel --lines 20 --nostream

echo ""
echo "=== 3. Kiểm tra BE Logs ==="
pm2 logs BE_BHair_SQLite --lines 20 --nostream

echo ""
echo "=== 4. Kiểm tra Port 3000 ==="
netstat -tlnp | grep 3000

echo ""
echo "=== 5. Test Local ==="
curl -I http://localhost:3000

echo ""
echo "=== 6. Kiểm tra web/dist ==="
ls -lh /root/BE_BHair/web/dist/ 2>/dev/null || echo "❌ web/dist không tồn tại!"

echo ""
echo "=== 7. Kiểm tra git branch ==="
cd /root/BE_BHair
git branch --show-current
git log -1 --oneline
