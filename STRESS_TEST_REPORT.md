# Stress Test Report & Worst-Case Test Plan

Mục tiêu hiện tại không chỉ là xem endpoint login chịu được bao nhiêu request/giây, mà là trả lời câu hỏi thực tế hơn:

> Khi người dùng thật cùng lúc mở app, tìm shop, xem chi tiết, lấy slot, đăng nhập và một phần nhỏ đặt lịch, server Android + SQLite + Cloudflare Tunnel bắt đầu chậm/hỏng ở ngưỡng nào?

## Kết luận về bài test cũ

Bài test cũ bằng Autocannon trên `POST /api/v1/user/login` vẫn có giá trị, nhưng chỉ nên xem là **CPU/bcrypt benchmark**.

Điểm tốt:

- Đúng khi muốn tìm giới hạn CPU vì `bcrypt.compare` rất nặng.
- Phát hiện được PM2 cluster giúp tăng tải login rõ rệt.
- Phát hiện thermal throttling sau khi chạy tải cao liên tục.
- Có quan sát đúng về giới hạn network stack/Wi-Fi khi ép hàng nghìn connection.

Điểm chưa đủ cho worst-case thực tế:

- Chỉ test 1 endpoint login, không đại diện cho hành vi app thật.
- Không đo SQLite write contention, nhất là tạo lịch hẹn cùng slot.
- Không đo Cloudflare Tunnel theo traffic hỗn hợp.
- Không có script tái lập trong repo, khó so sánh kết quả giữa các lần test.
- Các mức 1,500-5,000 concurrent connection là stress cực đoan, dễ đo ra giới hạn Wi-Fi/client hơn là giới hạn app.
- Chưa có tiêu chí pass/fail theo p95/p99 latency và error rate.

Vì vậy repo đã thêm script mới:

```bash
npm run stress:worst
```

Script nằm ở `scripts/worst-case-load-test.js`, không cần cài thêm package, chạy bằng Node.js 20+.

## Cách test nên dùng

### 1. Baseline nhẹ

Mục tiêu: xác nhận server/tunnel ổn trước khi tăng tải.

```bash
npm run stress:worst -- --base-url https://api.bhair.site --scenario realistic --concurrency 20 --duration 60 --ramp 15
```

Kỳ vọng:

- Error rate gần 0%.
- p95 dưới 1-2 giây với read-heavy endpoints.
- Không có timeout.

### 2. Realistic worst-case

Mục tiêu: mô phỏng giờ cao điểm thật: nhiều người mở app, search, xem shop, check slot, một phần login.

```bash
npm run stress:worst -- --base-url https://api.bhair.site --scenario realistic --concurrency 100 --duration 180 --ramp 30 --login-phone 0900000001 --login-password 123456
```

Tăng dần concurrency:

```bash
npm run stress:worst -- --scenario realistic --concurrency 200 --duration 180 --ramp 45 --login-phone 0900000001 --login-password 123456
npm run stress:worst -- --scenario realistic --concurrency 500 --duration 240 --ramp 60 --login-phone 0900000001 --login-password 123456
```

Ngưỡng thực tế nên lấy là mức cao nhất mà:

- Error rate dưới 1-3%.
- p95 dưới 3 giây.
- p99 dưới 8-10 giây.
- Server không restart, PM2 không tăng restart count.
- Nhiệt độ không khiến throughput tụt mạnh sau 2-3 phút.

### 3. Login/bcrypt ceiling

Mục tiêu: giữ lại bài test cũ nhưng chạy tái lập được.

```bash
npm run stress:login -- --base-url https://api.bhair.site --concurrency 200 --duration 120 --ramp 30 --login-phone 0900000001 --login-password 123456
```

Kịch bản này cố tình nặng CPU. Không dùng nó để kết luận “app chịu được bao nhiêu user thật”, chỉ dùng để biết login là nút cổ chai cỡ nào.

### 4. Read-heavy public traffic

Mục tiêu: đo lượng khách vãng lai mở trang/app nhưng chưa đăng nhập.

```bash
npm run stress:worst -- --scenario read-heavy --concurrency 300 --duration 240 --ramp 60
```

Kịch bản này đánh vào:

- `GET /api/v1/search`
- `GET /api/v1/shop/:id`
- `GET /api/v1/service/shop/:shopId`
- `GET /api/v1/shop/:shopId/slots`

Đây thường là test quan trọng nhất nếu app có nhiều người xem nhưng ít người đặt lịch.

### 5. Booking race test

Mục tiêu: kiểm tra trường hợp xấu nhất của SQLite/app logic: nhiều người cùng cố đặt lịch gần nhau.

Mặc định script **không ghi dữ liệu**. Muốn test tạo lịch thật phải bật `--allow-writes`.

Nên chạy trên database test hoặc sau khi backup SQLite:

```bash
npm run stress:worst -- --scenario booking-race --allow-writes --concurrency 20 --duration 60 --ramp 10 --login-phone 0900000001 --login-password 123456 --shop-id <SHOP_ID> --service-id <SERVICE_ID>
```

Không nên chạy `booking-race` thẳng trên production nếu chưa backup, vì nó có thể tạo lịch hẹn test.

### 6. Soak test

Mục tiêu: tìm thermal throttling, memory leak, PM2 restart sau thời gian dài.

```bash
npm run stress:worst -- --scenario soak --concurrency 80 --duration 1800 --ramp 120 --login-phone 0900000001 --login-password 123456
```

Chạy ít nhất 30 phút. Với điện thoại Android, kết quả soak quan trọng hơn spike ngắn vì nhiệt độ mới là giới hạn vật lý chính.

## Theo dõi server trong lúc test

Trên Android/Ubuntu chroot, mở một SSH terminal riêng:

```bash
pm2 monit
```

Terminal khác:

```bash
pm2 logs BE_BHair_SQLite --lines 100
```

Theo dõi nhiệt/pin:

```bash
acc --info | grep -E "temp|level|status"
```

Theo dõi RAM/CPU:

```bash
top
free -h
```

Nếu test qua Cloudflare Tunnel, theo dõi tunnel:

```bash
pm2 logs tunnel --lines 100
```

## Cách đọc kết quả

Sau mỗi lần chạy, script ghi JSON vào:

```text
stress-results/
```

Các chỉ số cần nhìn:

- `okRps`: số request thành công/giây.
- `errorRate`: tỷ lệ lỗi tổng.
- `latencyMs.p95`: trải nghiệm của 95% request.
- `latencyMs.p99`: đuôi chậm, thường lộ khi CPU nóng hoặc SQLite lock.
- `errors.timeout`: request không kịp trả lời.
- `errors.network`: lỗi TCP/tunnel/Wi-Fi.
- `routes`: endpoint nào là nút cổ chai.

Không nên chỉ nhìn RPS. Với app đặt lịch, p95/p99 và lỗi 409/400/500 quan trọng hơn.

## Kết luận kỹ thuật hiện tại

Test cũ đủ để chứng minh login bcrypt làm CPU nóng và PM2 cluster có ích, nhưng chưa đủ để biết server chịu được “trường hợp xấu nhất trong thực tế”.

Bộ test mới nên dùng theo thứ tự:

1. `read-heavy` để biết sức chịu tải public.
2. `realistic` để biết giờ cao điểm thật.
3. `login-bcrypt` để biết trần CPU.
4. `booking-race` trên DB test để biết SQLite/write logic có khóa nghẽn không.
5. `soak` để biết sau 30-60 phút điện thoại có tụt hiệu năng vì nhiệt không.

Ngưỡng nên công bố cho server không phải là “5000 concurrent connection”, mà là:

> Server chịu được X concurrent realistic users trong Y phút, với p95 dưới Z giây và error rate dưới N%, trước khi thermal throttling hoặc network timeout xuất hiện.
