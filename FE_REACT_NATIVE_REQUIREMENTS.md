# Tài liệu Đặc tả Yêu cầu cho dự án React Native (B_Hair App)

Tài liệu này được tạo ra để hướng dẫn một AI khác (hoặc lập trình viên) xây dựng ứng dụng Frontend React Native kết nối với Backend của hệ thống **Haircut Booking System API (B_Hair App)**.

## 1. Tổng quan dự án
- **Mục tiêu:** Xây dựng ứng dụng di động cho phép người dùng (Khách hàng) đặt lịch cắt tóc, xem dịch vụ, tìm kiếm tiệm cắt tóc, và đánh giá. Đồng thời hỗ trợ Quản lý tiệm (Manager) quản lý cửa hàng, dịch vụ và thợ cắt tóc.
- **Backend Base URL:** `https://be-bhair.onrender.com/api/v1` (Đã deploy lên Render).

## 2. Tech Stack Đề xuất
- **Framework:** React Native (sử dụng Expo hoặc React Native CLI tùy thuộc vào yêu cầu build).
- **Navigation:** `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`.
- **State Management:** `Zustand` hoặc `Redux Toolkit` (để quản lý global state như `user`, `auth token`, `current booking`).
- **Data Fetching & Caching:** `Axios` + `@tanstack/react-query` (React Query) để gọi API và quản lý cache.
- **UI & Styling:** `NativeWind` (Tailwind CSS cho React Native) hoặc `StyleSheet` mặc định, kết hợp react-native-paper / ui-kitten nếu cần UI kit.
- **Form Handling:** `react-hook-form` + `yup`/`zod` để validate form đăng nhập, đăng ký.
- **Bản đồ (Map):** `react-native-maps` để hỗ trợ tính năng tìm kiếm tiệm xung quanh dựa trên tọa độ (lat, long).

## 3. Cấu trúc Thư mục (Folder Structure Recommended)
```
src/
│── api/            # Cấu hình Axios, các function gọi API (auth.api.ts, shop.api.ts,...)
│── assets/         # Hình ảnh, fonts, icons.
│── components/     # Các UI Component dùng chung (Button, Input, Card, Header...)
│── constants/      # Các hằng số (Colors, Typography, API_URL,...)
│── hooks/          # Custom hooks (e.g., useAuth, useBooking,...)
│── navigation/     # Cấu hình React Navigation (Root, AuthStack, MainTab,...)
│── screens/        # Các màn hình chính (Login, Home, ShopDetail, Booking, Profile,...)
│── store/          # Cấu hình Zustand/Redux state
│── types/          # TypeScript interfaces (Models: User, Shop, Service, Appointment,...)
│── utils/          # Các hàm tiện ích (formatDate, formatCurrency,...)
└── App.tsx         # Entry point
```

## 4. Danh sách các Màn hình (Screens)

### 4.1. Auth Flow
- **Splash Screen:** Kiểm tra trạng thái đăng nhập (Token storage).
- **Login Screen:** Nhập Số điện thoại & Mật khẩu. Tham chiếu API: `POST /user/login`.
- **Register Screen:** Nhập SĐT, Mật khẩu, Họ tên, Role (CUSTOMER/MANAGER). Tham chiếu API: `POST /user/register`.

### 4.2. Main Tab (Khách hàng)
- **Home Tab:** Hiển thị danh sách tiệm nổi bật, các dịch vụ phổ biến, ô tìm kiếm nhanh (Tích hợp API Search).
- **Search Tab:** Bản đồ / Danh sách tìm kiếm tiệm quanh khu vực (truyền `keyword`, `lat`, `long`). Tham chiếu API: `GET /search`.
- **Appointments Tab:** Quản lý danh sách lịch hẹn của tôi (Đang chờ, Đã hoàn thành, Đã hủy). Tham chiếu API: `GET /appointment/me`.
- **Profile/Settings Tab:** Hiển thị thông tin cá nhân, đăng xuất. Tham chiếu API: `GET /user/profile`.

### 4.3. Đặt lịch & Chi tiết Tiệm (Booking Flow)
- **Shop Detail Screen:** Hiển thị thông tin tiệm, đánh giá (Reviews), danh sách thợ và dịch vụ.
  - API: `GET /shop/:shopId`, `GET /service/shop/:shopId`, `GET /review/shop/:shopId`.
- **Booking Screen 1 - Chọn Dịch vụ & Thợ:** Lựa chọn `serviceIds` và `barberId`.
- **Booking Screen 2 - Chọn Thời gian:** Hiển thị calendar và list slots. 
  - API: `GET /shop/:shopId/slots?date={YYYY-MM-DD}&barberId={barberId}`.
- **Booking Screen 3 - Xác nhận:** Review lại thông tin và xác nhận tạo `Appointment`.
  - API: `POST /appointment`.

### 4.4. Manager Flow (Dành cho Role Quản lý tiệm)
- **My Shops:** Xem danh sách tiệm mình quản lý: `GET /shop/my-shops`.
- **Create Shop:** Đăng ký cửa hàng mới (Upload multiple images, config slot duration...): `POST /shop`.
- **Create Service:** Tạo dịch vụ cho tiệm: `POST /service`.
- **Manage Appointments:** Xem lịch hẹn của khách đối với cửa hàng (Backend cần hỗ trợ API list appointments by shop).

## 5. Đặc tả API RESTful Integration (B_Hair Backend)

Cần tạo một `axiosInstance` chặn (intercept) request để tự động lấy token từ `AsyncStorage` (hoặc `SecureStore`) và truyền vào Header `Authorization: Bearer <token>`. Base URL: `https://be-bhair.onrender.com/api/v1`

### 5.1. User & Authentication (Auth)
Quản lý đăng nhập, đăng ký và thông tin cá nhân.
* **POST /user/register**
  * **Mô tả:** Đăng ký tài khoản mới (Customer hoặc Manager).
  * **Body:** `{ "phoneNumber": "string required", "password": "string required", "fullName": "string required", "role": "CUSTOMER | MANAGER" }`
  * **Response (201):** `{ "message": "User registered successfully", "user": { "_id", "fullName", "phoneNumber", "role" } }`
* **POST /user/login**
  * **Mô tả:** Đăng nhập.
  * **Body:** `{ "phoneNumber": "string required", "password": "string required" }`
  * **Response (200):** `{ "message": "Login successful", "token": "JWT_STRING", "user": {...} }`
* **GET /user/profile**
  * **Mô tả:** Lấy thông tin user hiện tại. Yêu cầu Auth Token.
  * **Response (200):** `{ "_id", "fullName", "phoneNumber", "role", "avatar", "createdAt" }`

### 5.2. Shop Management
Quản lý thông tin các tiệm cắt tóc.
* **POST /shop** (Manager Only)
  * **Mô tả:** Tạo cửa hàng mới. Hỗ trợ upload ảnh.
  * **FormData:** `name`, `address`, `phone`, `coordinates` (JSON string `[lon, lat]`), `openTime` (HH:mm), `closeTime` (HH:mm), `slotDuration` (Number mins), `images1` (File).
* **GET /shop/my-shops** (Manager Only)
  * **Mô tả:** Lấy danh sách tiệm do Manager quản lý.
  * **Response (200):** `[ { "_id", "name", "address", "phone", "images", ... } ]`
* **GET /shop/:shopId**
  * **Mô tả:** Lấy chi tiết thông tin một tiệm cụ thể. Hỗ trợ hiển thị trên App Khách hàng.
  * **Response (200):** `{ "_id", "name", "address", "phone", "openTime", "closeTime", "images", "location": { "coordinates": [lon,lat] } }`

### 5.3. Service Management
Quản lý các dịch vụ (Cắt, Gội, Nhuộm...) trong tiệm.
* **POST /service** (Manager Only)
  * **Mô tả:** Thêm dịch vụ cho tiệm. Hỗ trợ upload ảnh minh họa.
  * **FormData:** `shopId`, `name`, `price` (Number), `managerExtraFee` (Number), `duration` (Number mins), `coverImg` (File).
* **GET /service/shop/:shopId**
  * **Mô tả:** Lấy danh sách toàn bộ dịch vụ của một tiệm.
  * **Response (200):** `[ { "_id", "name", "price", "duration", "coverImg", ... } ]`

### 5.4. Schedule & Time Slots
Truy vấn khung giờ trống cho việc đặt lịch.
* **GET /shop/:shopId/slots**
  * **Mô tả:** Lấy danh sách khung giờ trống trong ngày do tiệm cung cấp (kết hợp logic thợ cắt tóc).
  * **Query Params:** `?date=YYYY-MM-DD` (Bắt buộc), `&barberId=xxx` (Tùy chọn, nếu muốn đặt thợ cụ thể).
  * **Response (200):** `{ "slots": ["08:00", "08:30", "09:00", ...] }`

### 5.5. Booking & Appointments
Luồng đặt lịch cắt tóc.
* **POST /appointment**
  * **Mô tả:** Tạo lịch hẹn mới (Khách hàng đặt lịch).
  * **Body:** `{ "shopId": "ObjectId required", "serviceIds": ["ObjectId required"], "barberId": "ObjectId optional (null)", "bookingDate": "ISO String (YYYY-MM-DDTHH:mm:SS.000Z)", "note": "Ghi chú khách hàng" }`
  * **Response (201):** `{ "message": "Appointment created", "appointment": { "_id", "status": "PENDING", ... } }`
* **GET /appointment/me**
  * **Mô tả:** Lấy danh sách các lịch hẹn của Khách hàng hiện tại.
  * **Response (200):** `[ { "_id", "shopId", "serviceIds", "bookingDate", "status", "totalPrice" ... } ]`

### 5.6. Reviews & Real-time Khác
* **POST /review**
  * **Mô tả:** Gửi đánh giá cho 1 lịch hẹn đã hoàn thành.
  * **Body:** `{ "appointmentId": "ObjectId", "rating": Number (1-5), "comment": "string" }`
* **GET /review/shop/:shopId**
  * **Mô tả:** Lấy đánh giá về tiệm, kèm điểm trung bình.
* **GET /search**
  * **Mô tả:** Tìm kiếm tiệm theo tên hoặc tọa độ địa lý.
  * **Query Params:** `?keyword=string`, `&lat=number&long=number` (tìm tiệm gần đây).
* **GET /notification**
  * **Mô tả:** Lấy danh sách thông báo. Đánh dấu đã đọc.

## 6. Hướng dẫn Prompt Dành cho AI Code

Để AI có thể tự động sinh code dựa trên tài liệu này, hãy cung cấp cho AI các bước (prompts) tuần tự sau:

1. **Bước 1 (Khởi tạo):** "Hãy khởi tạo một dự án React Native (Expo) với Typescript. Cấu hình các thư viện như React Navigation, Axios, Zustand và NativeWind."
2. **Bước 2 (Types & API Layer):** "Dựa vào đặc tả API trong tài liệu, hãy tạo thư mục `src/types` chứa các interface và tạo thư mục `src/api` chứa `axiosInstance` cùng các hàm gọi API (auth, shop, booking, user)."
3. **Bước 3 (Auth Flow):** "Tạo State quản lý đăng nhập bằng Zustand. Xây dựng màn hình Login, Register và thiết lập cơ chế lưu trữ token."
4. **Bước 4 (Navigation Layout):** "Thiết lập Bottom Tabs Navigation cho ứng dụng sau khi User đã đăng nhập, bao gồm: Home, Search, Appointments, và Profile."
5. **Bước 5 (Shop & Booking Flow):** "Viết UI cho màn hình chi tiết tiệm cắt tóc (ShopDetailScreen). Sau đó xây dựng luồng đặt lịch (BookingFlow) gồm 3 bước: Chọn Dịch vụ/Thợ -> Chọn Thời gian (Slots API) -> Xác nhận đặt lịch."
6. **Bước 6 (Tích hợp bản đồ & Search):** "Xây dựng màn hình Tìm kiếm tích hợp Google Maps để hiển thị các tiệm cắt tóc gần vị trí."

*(End of specifications)*
