# Kiến Trúc Server Điện Thoại Android (Termux) - Dự án B-Hair

Tài liệu này ghi chú lại toàn bộ cấu trúc hạ tầng hiện tại của hệ thống Backend đang chạy trên thiết bị di động (Android Termux). Dùng để làm ngữ cảnh (context) cho các AI khác tiếp tục phát triển và nâng cấp hệ thống.

---

## 1. Thành phần Hệ thống Hiện tại (Stack)
- **Thiết bị:** Điện thoại Android (Đã Root bằng Magisk).
- **Môi trường Server:** Termux (Linux emulator).
- **Backend:** Node.js (TypeScript) + Express.
- **Database:** MongoDB Atlas (Cloud).
- **Lưu trữ Media:** Cloudinary (Cloud).
- **Quản lý tiến trình (Process Manager):** PM2 (giữ server chạy ngầm 24/7).
- **Mạng & Domain:** Cloudflare Tunnel (Cloudflared) - Expose cổng localhost (3000) ra tên miền quốc tế `https://api.bhair.site` mà không cần IP tĩnh hay mở port (Port Forwarding).

---

## 2. Quy trình CI/CD Tự động (Deployment Pipeline)
Hệ thống sử dụng cơ chế **"Standard CI + Webhook CD"** cực kỳ tối ưu cho điện thoại:

1. **Bước CI (Kiểm tra - GitHub Actions):** 
   - File cấu hình: `.github/workflows/deploy.yml`
   - Bất cứ khi nào có code mới đẩy lên nhánh `main`, máy ảo Ubuntu của GitHub sẽ kéo code về, cài dependencies (`npm install`) và kiểm tra biên dịch (`npm run build`).
   - Nếu lỗi cú pháp, quá trình dừng lại, bảo vệ Server điện thoại không bị lỗi.

2. **Bước CD (Triển khai - Termux Webhook):**
   - Khi bước CI thành công, GitHub gọi một POST request đến API của Server điện thoại: `https://api.bhair.site/api/deploy` kèm theo Secret Key (`DEPLOY_SECRET`).
   - Server điện thoại xác thực key, tự động chạy lệnh shell: 
     `git pull origin main && npm run build && pm2 restart BE_BHair`
   - Hệ thống tự cập nhật code mới mượt mà, hoàn toàn tự động.

---

## 3. Các Vấn đề Cần Lưu Ý (Bottlenecks & Limits)
- **Port:** Termux không có quyền sử dụng các cổng hệ thống `< 1024` (bị lỗi EACCES permission denied). Do đó, Node.js phải chạy ở các cổng cao (ví dụ: `PORT=3000`).
- **CPU (htop):** Hệ điều hành Android đời mới cấm các app không root (như Termux) đọc chỉ số CPU (`/proc/stat`). Do đó, các công cụ như `htop` sẽ báo CPU `offline` hoặc `N/A`, nhưng thực tế máy vẫn đang xử lý cực tốt. Tương tự, PM2 sẽ báo lỗi nhẹ không đọc được `/proc/uptime` nhưng tự động chuyển qua `os.uptime()`.
- **Giới hạn chịu tải (Load Testing):** 
  - Qua bài test `autocannon`, hệ thống gánh được khoảng **~750 RPS** (Requests Per Second) cho các tác vụ Ping/Pong nhẹ.
  - Khi ép xung lên **1000 CCU** (Concurrent Users), bắt đầu xảy ra hiện tượng độ trễ tăng cao (lên tới 7s) và xuất hiện Timeout.
  - Điểm nghẽn thực tế lớn nhất khi vận hành CRUD là **giới hạn connection của MongoDB Atlas (500 connections)** và **CPU đơn luồng của Node.js** khi xử lý mã hoá (bcrypt).

---

## 4. Hướng Nâng Cấp Tiếp Theo (Tự Host 100%)
Nếu muốn tận dụng tối đa 70GB bộ nhớ rỗng của điện thoại và cắt đứt sự phụ thuộc vào các dịch vụ Cloud bị giới hạn (MongoDB Atlas, Cloudinary):

1. **Database:** 
   - Giải pháp 1: Cài đặt thẳng máy chủ `MongoDB` vào Termux.
   - Giải pháp 2 (Khuyên dùng): Chuyển đổi sang `SQLite` - rất nhẹ, dạng file tĩnh, truy xuất siêu tốc (Zero latency) và không cần chạy background service phức tạp như Mongo.
2. **Lưu trữ Ảnh/Video:**
   - Dùng thư viện `multer` trong Node.js để lưu trực tiếp file upload vào thư mục `/uploads` trên điện thoại.
   - Cấu hình `express.static()` để public thư mục này ra web.
   - *Đánh đổi:* Sẽ tiêu tốn băng thông Upload của mạng Wifi nhà khi có nhiều user truy cập ảnh cùng lúc (Thay vì Cloudinary có sẵn CDN toàn cầu).

**Kết luận:** Hạ tầng Server Termux hiện tại kết hợp Cloudflare Tunnel và CI/CD Webhook là một kiến trúc rất hoàn thiện, đủ sức phục vụ ổn định cho ứng dụng B-Hair quy mô nhỏ và vừa.

---

## 5. Sổ tay Lệnh (Cheat Sheet)
Tổng hợp các lệnh hay dùng nhất để quản lý Server trên điện thoại:

### Quản lý PM2 (Node.js & Cloudflare Tunnel)
- `pm2 ls`: Xem danh sách các app đang chạy (cả Web lẫn Tunnel).
- `pm2 monit`: Mở bảng điều khiển xịn xò xem CPU/RAM của Node.js theo thời gian thực.
- `pm2 logs`: Xem nhật ký (Console log) của Web xem có lỗi gì không.
- `pm2 restart BE_BHair`: Khởi động lại Server Node.js.
- `pm2 delete myserver`: Xoá vĩnh viễn một app (ví dụ app tên là myserver) ra khỏi danh sách.
- `pm2 save`: **Quan trọng!** Lưu lại danh sách hiện tại. Luôn gõ lệnh này sau khi Thêm/Xoá một app.
- `pm2 resurrect`: Khôi phục lại danh sách các app từ bản save gần nhất (dùng khi PM2 bị tắt mở lại).

### Ép xung & Hệ thống Termux
- `htop`: Mở bảng xem tổng thể CPU/RAM của cả điện thoại (Bấm phím `q` để thoát).
- `npx autocannon -c 100 -d 10 https://api.bhair.site/`: Bắn 100 khách hàng truy cập cùng lúc trong 10 giây để test tải server.
- `termux-setup-storage`: Xin quyền truy cập vào bộ nhớ chung (Thư viện Ảnh, Tệp tin) của điện thoại.
- `termux-wake-lock`: Bật chế độ chống ngủ đông (Tránh sập web khi tắt màn hình đt).

### Tự động khởi động (Termux:Boot)
Nếu lỡ cấu hình sai hoặc muốn tạo lại file script khởi động tự động:

**Lưu ý quan trọng:** PM2 dùng shebang `#!/usr/bin/env node` nhưng Termux không có `/usr/bin/env`. Do đó PHẢI gọi trực tiếp `node` bằng absolute path, không được gọi `pm2` trực tiếp.

```bash
# B1: Mở file script:
nano ~/.termux/boot/start_server.sh

# B2: Dán đúng 4 dòng này (KHÔNG thêm dòng trống):
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
sleep 5
/data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/usr/lib/node_modules/pm2/bin/pm2 resurrect

# B3: Lưu (Ctrl+O -> Enter -> Ctrl+X) và cấp quyền:
chmod +x ~/.termux/boot/start_server.sh
```
