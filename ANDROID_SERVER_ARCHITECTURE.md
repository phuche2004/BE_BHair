# Kiến Trúc Server Điện Thoại Android (Termux + Ubuntu Chroot) - Dự án B-Hair

Tài liệu này ghi chú lại toàn bộ cấu trúc hạ tầng hiện tại của hệ thống Backend đang chạy trên thiết bị di động (Android). Dùng để làm ngữ cảnh (context) cho các AI khác tiếp tục phát triển và nâng cấp hệ thống. Hệ thống đã được nâng cấp từ Termux thuần túy lên môi trường chroot Ubuntu 22.04 chuẩn server.

---

## 1. Thành phần Hệ thống Hiện tại (Stack)
- **Thiết bị:** Điện thoại Redmi Note 11 4G (Đã Root bằng Magisk).
- **Môi trường Server:** Ubuntu 22.04 LTS (Chạy qua cơ chế Chroot bên trong Termux).
- **Backend:** Node.js (TypeScript) + Express. Cài đặt Node.js v20 qua NodeSource chuẩn Linux.
- **Database:** MongoDB Atlas (Cloud).
- **Lưu trữ Media:** Local Storage (Trỏ trực tiếp ra bộ nhớ trong của điện thoại `/sdcard/Download/Phuc_Data`).
- **Lưu trữ Mạng (NAS):** Samba Server (SMB) cấu hình qua Ubuntu, chia sẻ không cần pass trên mạng nội bộ LAN.(root,1)
- **Quản lý tiến trình (Process Manager):** PM2 (giữ server chạy ngầm 24/7).
- **Điều khiển từ xa (Remote):** SSH Server (OpenSSH) chạy trên cổng `2222`. Kết nối không cần mật khẩu (SSH Key).
- **Mạng & Domain:** Cloudflare Tunnel (Cloudflared). Chạy ở chế độ **Locally Managed** qua HTTP/2. Expose cổng localhost (3000) ra tên miền quốc tế `https://api.bhair.site`.
- **Tối ưu Hệ điều hành:** Sử dụng **Hail** (Root) để đóng băng (Freeze) toàn bộ các app chạy ngầm không cần thiết (Facebook, Google, Bloatware Xiaomi) để giải phóng RAM tối đa.

---

## 2. Quy trình CI/CD Tự động (Deployment Pipeline)
Hệ thống sử dụng cơ chế **"Build Artifacts & Trigger Webhook"** phân tách rõ ràng giữa môi trường Web và Mobile Server:

1. **Vercel (Môi trường Web Production):**
   - Vercel được cấu hình `Ignored Build Step: Only build production` để nó chỉ tự động deploy khi có code mới ở nhánh `main`. Bỏ qua hoàn toàn các nhánh phụ.

2. **GitHub Actions (Build & Push Artifacts):**
   - File cấu hình: `.github/workflows/deploy.yml`
   - Khi có code mới đẩy lên `main`, GitHub sẽ compile mã TypeScript thành JavaScript trong thư mục `dist/`.
   - Action sẽ dọn dẹp sạch sẽ rác (dùng `git rm -rf --ignore-unmatch src/ mobile/ web/...`) nhưng vẫn giữ lại `src/views/` cho EJS.
   - Toàn bộ cục code (Artifact) sạch sẽ này được ép push (Force Push) sang nhánh `production`.

3. **Trigger Android Server (Gọi điện thoại dậy):**
   - Sau khi đẩy code sang nhánh `production`, GitHub Actions bắn một tín hiệu Webhook xuống địa chỉ IP/Domain của con điện thoại.
   - Điện thoại nhận lệnh, gõ `git pull origin production` để lấy mã máy về và `pm2 restart BE_BHair` để cập nhật lập tức mà không cần build lại trên phần cứng yếu của điện thoại.

---

## 3. Các Vấn đề Cần Lưu Ý (Bottlenecks & Limits)
- **Xung đột mạng và Android Firewall (Paranoid Network):** Khi chạy Ubuntu chroot qua lệnh `su`, Android có thể rào các kết nối UDP. Do đó, Cloudflare Tunnel luôn phải được ép chạy bằng giao thức TCP (HTTP/2) thông qua cờ `--protocol http2`.
- **Lỗi Bóng Ma PM2 (Ghost Process & EADDRINUSE):** Nếu khởi động lại PM2 hoặc sập nguồn không đúng cách, Node.js có thể bị kẹt cổng 3000 gây ra vòng lặp lỗi `EADDRINUSE 0.0.0.0:3000`. Khi gặp lỗi này, **không nên đè thêm lệnh**, mà cần dùng `pm2 kill` và `lsof -t -i:3000 | xargs kill -9` để làm sạch hoàn toàn cổng trước khi bật lại.
- **Rớt Wifi / Mạng chập chờn:** Nếu điện thoại bị ngắt mạng tạm thời, Tunnel sẽ cố reconnect liên tục và có thể bị PM2 khóa cứng (trạng thái `errored` do khởi động lại quá 16 lần). Cách xử lý là đợi có mạng và gõ `pm2 restart tunnel` và `pm2 reset all`.
- **Cấu hình IP Tĩnh (Static IP):** Mặc định cục phát Wifi sẽ đổi IP của điện thoại liên tục (DHCP). Bắt buộc phải set IP Tĩnh (`Static`) trong phần Cài đặt Wifi của điện thoại, hoặc gán cứng địa chỉ MAC trên Router để IP không bao giờ đổi, giúp kết nối SSH luôn ổn định.
- **Lỗi Màn Hình Khoá (File-Based Encryption):** Khi điện thoại sập nguồn bật lại, nếu máy có cài Mật khẩu/Vân tay màn hình, hệ điều hành sẽ khóa toàn bộ các App chạy ngầm. Ứng dụng **Termux:Boot** sẽ không thể kích hoạt Server cho đến khi người dùng **mở khoá màn hình lần đầu tiên**. Cách khắc phục là gỡ bỏ hoàn toàn mật khẩu màn hình (None).

---

## 4. Quản lý Pin & Tối ưu Hiệu năng (ACC - Advanced Charging Controller)

Hệ thống sử dụng **ACC (Advanced Charging Controller)** để quản lý pin tối ưu cho server 24/7, kéo dài tuổi thọ pin và kiểm soát nhiệt độ.

### Cấu hình ACC
**Config tối ưu cho server:**
```bash
capacity=40,90,40-90
temperature=999,999,999,999
prioritizeBattIdleMode=true
idleThreshold=100
cooldownRatio=
```

**Giải thích:**
- **Capacity 40-90%:** Pin sẽ sạc từ 40% lên 90%, sau đó dừng sạc và chuyển sang idle mode (bypass pin, dùng nguồn điện trực tiếp).
- **Temperature 999:** Disable kiểm soát nhiệt độ (max performance).
- **Priority Battery Idle Mode:** Khi đạt 90%, điện cấp trực tiếp cho hệ thống, không qua pin.
- **Cooldown disabled:** Không tạm dừng sạc để làm mát (max performance).

### Setup ACC
```bash
# Chạy ACC config
su
acc --set capacity=40,90,40-90
acc --set temperature=999,999,999,999
acc --set prioritizeBattIdleMode=true
acc --set idleThreshold=100
acc --set cooldownRatio=
acc --daemon restart

# Kiểm tra status
acc --info
```

### Chu kỳ hoạt động
```
Pin = 90% → IDLE MODE (bypass pin, dùng nguồn điện trực tiếp)
    ↓
Pin tụt xuống 40% (leakage rất nhỏ, ~1-3 ngày)
    ↓
BẬT SẠC (40% → 90%, ~30-45 phút)
    ↓
DỪNG SẠC → Quay lại IDLE MODE
```

### Monitoring
```bash
# Xem status real-time
acc --info | grep -E "temp|level|status"

# Log nhiệt độ mỗi 5 phút
crontab -e
# Thêm: */5 * * * * acc --info | grep -E "temp|level" >> /root/acc_monitor.log
```

### Ưu điểm
- ✅ Kéo dài tuổi thọ pin (không sạc đầy 100%, không xả quá thấp)
- ✅ Giảm cycle count (chỉ sạc 1-2 lần/tuần)
- ✅ Bypass pin khi đầy → Giảm nhiệt, giảm stress
- ✅ Buffer 40% nếu mất điện (4-6 giờ uptime)

---

## 5. Truy Cập SSH Từ Xa (Tailscale VPN)
Hệ thống sử dụng **Tailscale** (mesh VPN dựa trên WireGuard) để truy cập SSH từ bất kỳ đâu mà không cần mở port hay config phức tạp.

### Setup Tailscale
**Trên điện thoại (Ubuntu chroot):**
```bash
# Cài đặt Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Chạy Tailscale daemon (userspace-networking mode cho chroot)
tailscaled --tun=userspace-networking --socks5-server=localhost:1055 --state=/var/lib/tailscale/tailscaled.state &

# Đăng nhập Tailscale (chạy lệnh và mở URL trên browser để authorize)
tailscale up --ssh --accept-routes

# Hoặc dùng auth key (lấy từ https://login.tailscale.com/admin/settings/keys)
tailscale up --ssh --accept-routes --authkey=tskey-auth-xxxxx

# Lưu vào PM2 để tự động khởi động
pm2 start tailscaled --name tailscaled -- --tun=userspace-networking --socks5-server=localhost:1055 --state=/var/lib/tailscale/tailscaled.state
pm2 save
```

**Lưu ý:** Sau khi `tailscale up` thành công lần đầu, daemon sẽ tự động reconnect khi khởi động lại.

**Trên máy tính Windows:**
```powershell
# Cài đặt Tailscale
winget install Tailscale.Tailscale

# Mở app Tailscale và login (cùng tài khoản với điện thoại)
```

### SSH Qua Tailscale
**Lấy IP Tailscale của điện thoại:**
```bash
tailscale status
# Output: 100.91.43.5  localhost-1  phuche2004p@  linux  -

tailscale ip -4
# Output: 100.91.43.5
```

**SSH từ máy tính:**
```bash
# Khi ra ngoài (khác WiFi)
ssh root@100.91.43.5 -p 2222

# Khi ở nhà (cùng WiFi) - nên dùng IP local (nhanh hơn)
ssh root@172.16.10.245 -p 2222
```

**Thêm vào SSH config (`C:\Users\PhucHe\.ssh\config`):**
```
Host AndroidServer
    HostName 172.16.10.245
    User root
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no

Host AndroidServerTailscale
    HostName 100.91.43.5
    User root
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no
```

**Sử dụng:**
```powershell
# Ở nhà (nhanh hơn)
ssh AndroidServer

# Ra ngoài (hoạt động mọi nơi)
ssh AndroidServerTailscale
```

### Ưu điểm Tailscale
- ✅ **P2P trực tiếp** khi có thể (nhanh nhất)
- ✅ **DERP relay** khi P2P không khả dụng (qua server Hong Kong - derp-20)
- ✅ **Không cần mở port** trên router
- ✅ **Miễn phí unlimited** (lên đến 100 devices)
- ✅ **Tự động reconnect** khi đổi mạng (WiFi ↔ 4G/5G)
- ✅ **Bảo mật cao** (WireGuard encryption + end-to-end)
- ✅ **Hoạt động mọi nơi** có internet (khác WiFi, khác thành phố, khác quốc gia)

---

## 6. Sổ tay Lệnh (Cheat Sheet)
Tổng hợp các lệnh hay dùng nhất để quản lý Server:

### Truy cập vào Server
Từ giao diện màn hình Termux gốc (`~ $`), gõ lệnh sau để mở đường ống vào thế giới Ubuntu Root:
```bash
su
/data/local/start_ubuntu.sh
cd /root/BE_BHair

```

### Quản lý PM2 (Phải ở bên trong Ubuntu)
- `pm2 ls`: Xem danh sách các app đang chạy (`BE_BHair` và `tunnel`).
- `pm2 logs`: Xem nhật ký (Console log) của Server.
- `pm2 restart BE_BHair`: Khởi động lại Server Node.js.
- `pm2 delete all`: Xoá sạch danh sách (Dùng khi bị lỗi ma nhập EADDRINUSE).
- `pm2 save`: **Quan trọng!** Lưu lại cấu hình để lần sau tự bật.

### Cloudflare Tunnel (Locally Managed)
- Login: `cloudflared tunnel login`
- Trỏ DNS: `cloudflared tunnel route dns -f bhair-ubuntu api.bhair.site`
- Chạy Tunnel bằng PM2: 
  `pm2 start cloudflared --name "tunnel" -- tunnel --protocol http2 --url http://localhost:3000 run bhair-ubuntu`

### Tự động khởi động (Termux:Boot)
Điện thoại sẽ tự động kích hoạt Server khi sập nguồn mở lại thông qua App **Termux:Boot**.

Cấu hình file Boot ở ngoài Termux (`~/.termux/boot/start_server.sh`):
```bash
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
su -c '/data/local/start_ubuntu.sh -c "service ssh start && service smbd start && pm2 resurrect"'
```
*(Lưu ý: Không được quên chmod +x cho file boot này).*

Cấu hình bộ nối Ubuntu (`/data/local/start_ubuntu.sh`):
```bash
mkdir -p /data/local/ubuntu/sdcard
mount -o bind /sdcard /data/local/ubuntu/sdcard
chroot $UBUNTU_DIR /bin/bash "$@"
```
*(Lưu ý: phải luôn có chữ `"$@"` ở cuối để nhận lệnh từ file Boot truyền vào).*

### Điều khiển Server từ xa (SSH qua VS Code / Antigravity IDE)
Khi Server đang hoạt động và chung mạng Wifi với máy tính, có thể Code trực tiếp trên điện thoại:
1. Mở IDE, chọn tính năng **Connect to SSH Host...** (có sẵn ở Antigravity IDE hoặc xài Extension Remote-SSH trên VS Code thường).
2. Kết nối bằng địa chỉ IP điện thoại: `ssh root@<IP_ĐIỆN_THOẠI> -p 2222`.
3. **Bỏ qua bước nhập Mật khẩu (SSH Keys):**
   - Đứng ở máy tính Windows, tạo một cặp chìa khoá bằng lệnh: `ssh-keygen -t ed25519`
   - Copy nội dung file `.pub` và chạy lệnh này ở bên trong Ubuntu của điện thoại: 
     `mkdir -p ~/.ssh && echo "<NỘI_DUNG_FILE_PUB>" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
   - Chỉnh sửa file `.ssh/config` trên máy tính để thêm cờ `IdentityFile ~/.ssh/id_ed25519`. Từ đó về sau sẽ tự động xuyên không mà không cần hỏi Pass.

### Thiết lập Ổ Đĩa Mạng (Samba/NAS)
Samba Server chia sẻ toàn bộ `/sdcard` (bộ nhớ điện thoại) qua mạng như ổ đĩa Z:.

**Cấu hình Samba:**
- File config: `/etc/samba/smb.conf`
- Share name: `PhoneStorage` (trỏ tới `/sdcard`)
- Cấu hình: `guest ok = yes`, `force user = root`, `bind interfaces only = no`
- Listen: `0.0.0.0:445` (tất cả interfaces, bao gồm Tailscale)
- Hosts allow: `172.16.10.0/24 100.0.0.0/8 127.0.0.1`

**Khởi động Samba:**
```bash
service smbd start
service nmbd start

# Kiểm tra status
service smbd status
```

**Truy cập từ Windows:**

**Cách 1: Thủ công (qua File Explorer)**
```powershell
# Ở nhà (cùng WiFi)
\\172.16.10.245\PhoneStorage

# Ra ngoài (qua Tailscale)
\\100.91.43.5\PhoneStorage

# Login: root / 1
```

**Cách 2: Script tự động (khuyên dùng)**

Đã tạo sẵn 2 script để chuyển đổi nhanh:

**Khi ở nhà:** `mount_home.bat`
```batch
net use Z: /delete /y
net use Z: \\172.16.10.245\PhoneStorage /user:root 1 /persistent:yes
```

**Khi ra ngoài:** `mount_remote.bat`
```batch
net use Z: /delete /y
net use Z: \\100.91.43.5\PhoneStorage /user:root 1 /persistent:yes
```

**Cách sử dụng:**
- Click đúp `mount_home.bat` khi về nhà (nhanh nhất)
- Click đúp `mount_remote.bat` khi ra ngoài (hoạt động mọi nơi)

**So sánh hiệu năng:**

| Tiêu chí | Local IP (172.16.10.245) | Tailscale IP (100.91.43.5) |
|----------|--------------------------|----------------------------|
| **Tốc độ đọc/ghi** | ~10-50 MB/s (giới hạn WiFi) | ~5-15 MB/s (qua Tailscale) |
| **Độ trễ (Latency)** | <1ms (cùng LAN) | 5-20ms (P2P) / 50-100ms (DERP) |
| **Hoạt động ở nhà** | ✅ Nhanh nhất | ✅ Hoạt động (chậm hơn) |
| **Hoạt động ra ngoài** | ❌ Không hoạt động | ✅ Hoạt động mọi nơi |
| **Phụ thuộc internet** | ❌ Không cần | ✅ Cần internet ở cả 2 đầu |
| **Use case** | Ở nhà, transfer file lớn | Ra ngoài, browse file, đọc doc |

**Khuyến nghị:**
- ✅ **Ở nhà**: Luôn dùng `mount_home.bat` (nhanh gấp 2-5 lần)
- ✅ **Ra ngoài**: Dùng `mount_remote.bat` (độ trễ chấp nhận được)
- ⚠️ **Transfer file lớn** (>1GB): Nên dùng local network hoặc đợi về nhà
- 💡 **Mẹo**: Script tự động ngắt kết nối cũ trước khi mount mới, không lo conflict

### Tối ưu hoá RAM (Debloat) bằng Root
- Không sử dụng các phần mềm dọn rác hiển thị phần trăm. Dùng **Developer Options -> Running Services** để đo kiểm tra.
- Dùng app **Hail** (Cấp quyền Root).
- Chọn chế độ **Root - Disable** để đóng băng vĩnh viễn các app không cần thiết như: Facebook, Google, Android Auto, Bloatware rác.
- **Lưu ý tử huyệt:** Không được đóng băng các app `microG Services`, `Gboard`, hoặc các tiến trình lõi có chữ `System UI`, `Android System`. Cần giữ hệ thống nguyên vẹn để không bootloop.
