#!/bin/bash
# Script fix tunnel một lần duy nhất

echo "=== XÓA VÀ TẠO LẠI TUNNEL ==="

# Stop tunnel hiện tại
pm2 delete tunnel

# Xóa tunnel cũ (nếu cần)
# cloudflared tunnel delete bhair-ubuntu

# Login Cloudflare (sẽ mở browser)
cloudflared tunnel login

# Tạo tunnel mới (hoặc dùng lại cũ)
# cloudflared tunnel create bhair-new

# Route DNS - QUAN TRỌNG!
echo "Routing DNS..."
cloudflared tunnel route dns bhair-ubuntu bhair.site
cloudflared tunnel route dns bhair-ubuntu www.bhair.site  
cloudflared tunnel route dns bhair-ubuntu api.bhair.site

# Chạy tunnel với config hiện tại
pm2 start cloudflared --name tunnel -- tunnel run bhair-ubuntu
pm2 save

echo "✅ Done! Đợi 30 giây rồi test..."
sleep 30

curl -I https://bhair.site
curl -I https://www.bhair.site
curl -I https://api.bhair.site
