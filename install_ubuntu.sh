#!/system/bin/sh
# Script tự động cài đặt Ubuntu 22.04 (ARM64) Chroot cho Android

echo "======================================"
echo "[*] BẮT ĐẦU CÀI ĐẶT UBUNTU 22.04 CHROOT"
echo "======================================"

UBUNTU_DIR="/data/local/ubuntu"

# 1. Kiểm tra quyền Root
if [ "$(id -u)" != "0" ]; then
    echo "[!] LỖI: Bạn phải chạy script này bằng quyền Root (gõ 'su' trước)!"
    exit 1
fi

# 2. Xóa Ubuntu cũ nếu có và tạo thư mục mới
echo "[*] Đang dọn dẹp và tạo thư mục tại $UBUNTU_DIR..."
rm -rf $UBUNTU_DIR
mkdir -p $UBUNTU_DIR
cd $UBUNTU_DIR

# 3. Tải Ubuntu Base (Dùng curl của Termux)
UBUNTU_URL="https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/ubuntu-base-22.04.5-base-arm64.tar.gz"
echo "[*] Đang tải Ubuntu RootFS (Khoảng 30MB)... Hãy kiên nhẫn chờ đợi!"
/data/data/com.termux/files/usr/bin/curl -L -o ubuntu-base.tar.gz $UBUNTU_URL

# 4. Giải nén hệ điều hành
echo "[*] Đang giải nén Hệ điều hành Ubuntu..."
# Dùng tar của Termux để đảm bảo không bị lỗi symlink
/data/data/com.termux/files/usr/bin/tar -xf ubuntu-base.tar.gz
rm ubuntu-base.tar.gz

# 5. Cấu hình Mạng & DNS
echo "[*] Đang cấu hình Mạng và DNS..."
echo "nameserver 8.8.8.8" > $UBUNTU_DIR/etc/resolv.conf
echo "nameserver 1.1.1.1" >> $UBUNTU_DIR/etc/resolv.conf
echo "127.0.0.1 localhost" > $UBUNTU_DIR/etc/hosts

# 6. Fix lỗi Android Paranoid Network (Cấp quyền Internet cho Ubuntu)
echo "aid_inet:x:3003:root" >> $UBUNTU_DIR/etc/group
echo "aid_net_raw:x:3004:root" >> $UBUNTU_DIR/etc/group

# 7. Tạo Script Mount & Khởi động Ubuntu
echo "[*] Đang tạo Script khởi động..."
cat << 'EOF' > /data/local/start_ubuntu.sh
#!/system/bin/sh
UBUNTU_DIR="/data/local/ubuntu"

# Mount các thiết bị nhân Kernel (Nếu chưa mount)
grep -q "$UBUNTU_DIR/proc" /proc/mounts || mount -t proc proc $UBUNTU_DIR/proc
grep -q "$UBUNTU_DIR/sys" /proc/mounts || mount -t sysfs sysfs $UBUNTU_DIR/sys
grep -q "$UBUNTU_DIR/dev " /proc/mounts || mount -o bind /dev $UBUNTU_DIR/dev
grep -q "$UBUNTU_DIR/dev/pts" /proc/mounts || mount -o bind /dev/pts $UBUNTU_DIR/dev/pts

export PATH=/bin:/usr/bin:/sbin:/usr/sbin
export HOME=/root

echo "======================================"
echo "    CHÀO MỪNG ĐẾN VỚI UBUNTU 22.04    "
echo "======================================"
chroot $UBUNTU_DIR /bin/su - root
EOF

chmod +x /data/local/start_ubuntu.sh

echo "======================================"
echo "[*] HOÀN TẤT! Đã cài đặt xong Ubuntu 22.04."
echo "[*] Bất cứ khi nào muốn vào Ubuntu, hãy gõ lệnh sau trong Termux:"
echo "su -c '/data/local/start_ubuntu.sh'"
echo "======================================"
