#!/bin/bash
echo "======================================"
echo "[*] ĐANG CÀI ĐẶT HẠ TẦNG SERVER UBUNTU"
echo "======================================"

# Bỏ qua các cảnh báo tương tác của apt
export DEBIAN_FRONTEND=noninteractive

echo "[1/4] Cập nhật hệ thống và cài đặt công cụ cơ bản..."
apt-get update
apt-get install -y curl wget git nano tzdata ca-certificates build-essential

echo "[2/4] Thiết lập Múi giờ Việt Nam..."
ln -fs /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime
dpkg-reconfigure --frontend noninteractive tzdata

echo "[3/4] Cài đặt Node.js 20.x và PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
pm2 startup ubuntu
pm2 save

echo "[4/4] Cài đặt Cloudflared (Native ARM64)..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
dpkg -i cloudflared-linux-arm64.deb
rm cloudflared-linux-arm64.deb

echo "======================================"
echo "[*] XONG GIAI ĐOẠN 2! Môi trường Server đã sẵn sàng."
echo "[*] Hãy gõ lệnh 'node -v' và 'pm2 -v' để kiểm tra!"
echo "======================================"
