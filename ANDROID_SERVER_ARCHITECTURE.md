# Kiến Trúc Server Điện Thoại Android (Termux + Ubuntu Chroot) - Dự án B-Hair

Tài liệu này ghi chú lại toàn bộ cấu trúc hạ tầng hiện tại của hệ thống Backend đang chạy trên thiết bị di động (Android). Dùng để làm ngữ cảnh (context) cho các AI khác tiếp tục phát triển và nâng cấp hệ thống. Hệ thống đã được nâng cấp từ Termux thuần túy lên môi trường chroot Ubuntu 22.04 chuẩn server.

---

## 1. Thành phần Hệ thống Hiện tại (Stack)
- **Thiết bị:** Điện thoại Redmi Note 11 4G (Đã Root bằng Magisk).
- **Môi trường Server:** Ubuntu 22.04 LTS (Chạy qua cơ chế Chroot bên trong Termux).
- **Backend:** Node.js (TypeScript) + Express. Cài đặt Node.js v20 qua NodeSource chuẩn Linux.
- **Database:** MongoDB Atlas (Cloud).
- **Lưu trữ Media:** Local Storage (Trỏ trực tiếp ra bộ nhớ trong của điện thoại `/sdcard/Download/Phuc_Data`).
- **Quản lý tiến trình (Process Manager):** PM2 (giữ server chạy ngầm 24/7).
- **Mạng & Domain:** Cloudflare Tunnel (Cloudflared). Chạy ở chế độ **Locally Managed** qua HTTP/2. Expose cổng localhost (3000) ra tên miền quốc tế `https://api.bhair.site`.

---

## 2. Quy trình CI/CD Tự động (Deployment Pipeline)
Hệ thống sử dụng cơ chế **"Standard CI + Webhook CD"**:

1. **Bước CI (Kiểm tra - GitHub Actions):** 
   - File cấu hình: `.github/workflows/deploy.yml`
   - Bất cứ khi nào có code mới đẩy lên nhánh `main`, máy ảo Ubuntu của GitHub sẽ kéo code về, cài dependencies (`npm install`) và kiểm tra biên dịch (`npm run build`).

2. **Bước CD (Triển khai - Termux Webhook):**
   - Khi bước CI thành công, GitHub gọi một POST request đến API của Server: `https://api.bhair.site/api/deploy`.
   - Server xác thực key, tự động chạy lệnh shell: 
     `git pull origin main && npm run build && pm2 restart BE_BHair`
   - Hệ thống tự cập nhật code mới, có thể gây ra hiện tượng Cloudflare báo lỗi đỏ vài giây (thời gian server restart), sau đó tự động phục hồi.

---

## 3. Các Vấn đề Cần Lưu Ý (Bottlenecks & Limits)
- **Xung đột mạng và Android Firewall (Paranoid Network):** Khi chạy Ubuntu chroot qua lệnh `su`, Android có thể rào các kết nối UDP. Do đó, Cloudflare Tunnel luôn phải được ép chạy bằng giao thức TCP (HTTP/2) thông qua cờ `--protocol http2`.
- **Lỗi Bóng Ma PM2 (Ghost Process & EADDRINUSE):** Nếu khởi động lại PM2 hoặc sập nguồn không đúng cách, Node.js có thể bị kẹt cổng 3000 gây ra vòng lặp lỗi `EADDRINUSE 0.0.0.0:3000`. Khi gặp lỗi này, **không nên đè thêm lệnh**, mà cần dùng `pm2 kill` và `lsof -t -i:3000 | xargs kill -9` để làm sạch hoàn toàn cổng trước khi bật lại.
- **Rớt Wifi / Mạng chập chờn:** Nếu điện thoại bị ngắt mạng tạm thời, Tunnel sẽ cố reconnect liên tục và có thể bị PM2 khóa cứng (trạng thái `errored` do khởi động lại quá 16 lần). Cách xử lý là đợi có mạng và gõ `pm2 restart tunnel` và `pm2 reset all`.

---



## 5. Sổ tay Lệnh (Cheat Sheet)
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
su -c '/data/local/start_ubuntu.sh -c "pm2 resurrect"'
```
*(Lưu ý: Không được quên chmod +x cho file boot này).*

Cấu hình bộ nối Ubuntu (`/data/local/start_ubuntu.sh`):
```bash
mkdir -p /data/local/ubuntu/sdcard
mount -o bind /sdcard /data/local/ubuntu/sdcard
chroot $UBUNTU_DIR /bin/bash "$@"
```
*(Lưu ý: phải luôn có chữ `"$@"` ở cuối để nhận lệnh từ file Boot truyền vào).*
