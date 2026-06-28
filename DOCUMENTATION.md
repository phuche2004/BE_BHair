# 📘 B_Hair - Hệ Thống Đặt Lịch Cắt Tóc (Barber Booking System)

> **Tài liệu context** — dùng làm reference cho AI/Người phát triển mới.

---

## 📦 1. TỔNG QUAN DỰ ÁN

| Thành phần | Thư mục | Công nghệ | Mô tả |
|---|---|---|---|
| **Backend API** | `src/` | Node.js, Express 5, TypeScript, MongoDB | RESTful API + Socket.io realtime + FCM Push |
| **Web Frontend** | `web/` | React 19, Vite, TypeScript, Zustand | PWA-like web app với KeepAlive Tabs |
| **Mobile App** | `mobile/` | React Native (Expo) | Tạm thời không phát triển |

- **BE Port:** `1000` (mặc định)
- **BE Host:** `0.0.0.0` (development: `192.168.110.117`)
- **DB:** MongoDB (Mongoose ODM)

### 🌐 Deployment URLs

| Môi trường | URL |
|---|---|
| **Backend (Production)** | `https://be-bhair.onrender.com` |
| **Backend API Base** | `https://be-bhair.onrender.com/api/v1` |
| **Frontend Web (Production)** | `https://web-b-hair.vercel.app` |
| **BE (Development)** | `http://localhost:1000` |
| **FE (Development)** | `http://localhost:5173` (Vite default) |

---

## 🔧 2. BACKEND (`src/`) — Chi Tiết

### 2.1. Cấu trúc thư mục

```
src/
├── server.ts                 # Entry point: Express + HTTP server + Socket.io
├── config/
│   ├── database.ts           # Kết nối MongoDB
│   ├── env.config.ts         # Load env vars (port, mongoUri)
│   ├── cloudinary.config.ts  # Cloudinary config & ping
│   ├── firebase.config.ts    # Firebase Admin SDK init
│   └── multer.config.ts      # Multer + Cloudinary storage
├── models/
│   ├── user.model.ts         # User (4 roles) + barberProfile
│   ├── shop.model.ts         # Shop (GeoJSON, subscription, schedule)
│   ├── service.model.ts      # Service (giá, thời lượng, extra fee)
│   ├── appointment.model.ts  # Appointment (booking flow, overlap check)
│   ├── reviews.model.ts      # Review (1-5 sao, 1 appt = 1 review)
│   ├── notification.model.ts # Notification (DB + socket + FCM)
│   └── history.model.ts      # HistoryLog (ghi log hành động)
├── controllers/              # Business logic cho từng model
│   ├── auth.controller.ts
│   ├── shop.controller.ts
│   ├── service.controller.ts
│   ├── appointment.controller.ts
│   ├── search.controller.ts
│   ├── review.controller.ts
│   ├── notification.controller.ts
│   ├── slot.controller.ts
│   └── ai.controller.ts
├── routes/                   # Express router (mỗi file 1 resource)
│   ├── auth.route.ts
│   ├── shop.route.ts
│   ├── service.route.ts
│   ├── appointment.route.ts
│   ├── search.route.ts
│   ├── review.route.ts
│   ├── notification.route.ts
│   ├── slot.route.ts
│   └── ai.route.ts
├── middlewares/
│   └── auth.middleware.ts    # JWT verify + role check
├── services/
│   ├── ai.service.ts         # Google Gemini AI (phân tích khuôn mặt)
│   └── notification.service.ts # Firebase FCM push
├── utils/
│   └── socket.ts             # Socket.io init + join_room
├── scripts/
│   └── seed.ts               # Seed database mẫu
├── types/                    # Type definitions (hiện trống)
└── dtos/                     # Data Transfer Objects (hiện trống)
```

### 2.2. Sơ đồ Route (API Endpoints)

Tất cả routes mount tại `/api/v1/...`

#### Auth (`/api/v1/user`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `POST` | `/user/register` | `multer.single('avatar')` | Đăng ký (phone + password) |
| `POST` | `/user/login` | — | Đăng nhập |
| `POST` | `/user/google` | — | Google OAuth login |
| `GET` | `/user/profile` | `auth` | Lấy profile |
| `PUT` | `/user/fcm-token` | `auth` | Cập nhật FCM token |

#### Shop (`/api/v1/shop`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `POST` | `/shop` | `auth` + `multer.fields(...)` | Tạo shop (MANAGER/ADMIN) |
| `GET` | `/shop/my-shops` | `auth` | Lấy shops của user hiện tại |
| `GET` | `/shop/:id` | — | Chi tiết shop (public) |
| `PUT` | `/shop/:id` | `auth` + `multer.fields(...)` | Cập nhật shop |
| `GET` | `/shop/:shopId/history` | `auth` | Lịch sử hoạt động shop |

#### Service (`/api/v1/service`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `GET` | `/service/shop/:shopId` | — | Lấy services của shop (public) |
| `POST` | `/service` | `auth` + `multer.single('image')` | Tạo service |
| `PUT` | `/service/:id` | `auth` + `multer.single('image')` | Cập nhật service |
| `DELETE` | `/service/:id` | `auth` | Xóa mềm service |

#### Appointment (`/api/v1/appointment`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `POST` | `/appointment` | `auth` | Tạo lịch hẹn |
| `GET` | `/appointment/me` | `auth` | Lịch của tôi (customer) |
| `GET` | `/appointment/:id` | `auth` | Chi tiết lịch hẹn |
| `PATCH` | `/appointment/:id/cancel` | `auth` | Hủy lịch |
| `PATCH` | `/appointment/:id/status` | `auth` | Đổi trạng thái (staff/admin) |
| `PATCH` | `/appointment/:id/services` | `auth` | Thay đổi dịch vụ (staff/admin) |
| `GET` | `/appointment/shop/:shopId` | `auth` | Lịch hẹn của shop (staff) |

#### Search (`/api/v1/search`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `GET` | `/search` | — | Tìm kiếm shop (keyword, lat, long, radius) |

#### Review (`/api/v1/review`)
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| `GET` | `/review/shop/:shopId` | — | Lấy reviews của shop (public) |
| `POST` | `/review` | `auth` | Tạo review (chỉ sau COMPLETED) |

#### Notification (`/api/v1/notification`) — All require auth
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/notification` | Lấy notifications của tôi |
| `PUT` | `/notification/:id/read` | Đánh dấu đã đọc |
| `PUT` | `/notification/read-all` | Đánh dấu tất cả đã đọc |

#### Slot (`/api/v1/shop/:shopId/slots`)
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/shop/:shopId/slots` | Lấy danh sách time slots (query: `date`, `barberId`) |

#### AI (`/api/v1/ai`)
| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/ai/analyze` | Phân tích khuôn mặt (Gemini) |
| `POST` | `/ai/try-style` | Thử kiểu tóc (chưa implement - 501) |

---

### 2.3. Models — Cấu trúc Schema

#### User (`User`)
```typescript
{
  phoneNumber: string (unique, sparse index)
  password: string
  email: string (unique, sparse index)
  googleId: string (unique, sparse index)
  fullName: string (required)
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER' (default: CUSTOMER)
  avatar: string
  isActive: boolean (default: true)
  shopId: ObjectId (ref: 'Shop', index)          // Liên kết với Shop
  fcmToken: string                                // Firebase Cloud Messaging token
  barberProfile: {                                // Chỉ áp dụng cho barber
    bio: string
    yearsExperience: number
    specialties: string[]
    isActive: boolean
  }
  createdAt, updatedAt (timestamps)
}
```
- **Auth:** phone+password (bcrypt) hoặc Google OAuth2 (`googleId`)
- **Indexes:** `phoneNumber`, `email`, `googleId`, `shopId`

#### Shop (`Shop`)
```typescript
{
  name: string
  address: string
  gender: 'MALE' | 'FEMALE' | 'BOTH'
  location: {
    type: 'Point'
    coordinates: [longitude, latitude]    // GeoJSON
  }
  phone: string
  images1: string[]                       // Ảnh bìa (Cover Image)
  images2: string[]                       // Ảnh giới thiệu / Tự do (Gallery / Free Upload)
  images3: string[]                       // Chưa sử dụng (Unused)
  videos: string[]
  managerId: ObjectId (ref: 'User')
  averageRating: number (default: 5)
  totalReviews: number (default: 0)
  isActive: boolean
  subscriptionPlan: string (default: 'MONTHLY')
  subscriptionExpiry: Date
  isPaid: boolean
  openTime: string (default: '09:00')
  closeTime: string (default: '21:00')
  breakStart: string (optional)
  breakEnd: string (optional)
  slotDuration: number (default: 30, minutes)
  createdAt, updatedAt
}
```
- **Indexes:** `location: 2dsphere`, `{ name: 'text', address: 'text' }`

#### Service (`Service`)
```typescript
{
  shopId: ObjectId (ref: 'Shop', required, index)
  name: string (required)
  description: string
  price: number (required, min 0, VND)
  managerExtraFee: number (default: 0)    // Phụ phí nếu manager làm
  duration: number (required, min 1, minutes)
  image: string
  isActive: boolean (default: true)
  createdAt, updatedAt
}
```

#### Appointment (`Appointment`)
```typescript
{
  shopId: ObjectId (ref: 'Shop', required, index)
  customerId: ObjectId (ref: 'User', index)
  customerName: string
  customerPhone: string
  barberId: ObjectId (ref: 'User', index)
  serviceIds: ObjectId[] (ref: 'Service')
  bookingDate: Date (required)
  endTime: Date (required)               // bookingDate + totalDuration
  totalPrice: number (required)
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  bookingCode: string (unique, auto-generated: #BH-XXXX)
  note: string
  serviceChanges: [{                     // Lịch sử thay đổi dịch vụ
    action: 'ADDED' | 'REMOVED'
    serviceId: ObjectId
    byName: string
    byId: ObjectId
    date: Date
  }]
  createdAt, updatedAt
}
```
- **Flow:** PENDING → (CONFIRMED) → (COMPLETED) → (có thể review)
- Có thể CANCEL ở PENDING hoặc CONFIRMED
- **Overlap check:** Kiểm tra barber bận + shop capacity trước khi tạo

#### Review (`Review`)
```typescript
{
  appointmentId: ObjectId (ref: 'Appointment', unique)
  shopId: ObjectId (ref: 'Shop')
  customerId: ObjectId (ref: 'User')
  barberId: ObjectId (ref: 'User')
  rating: number (1-5)
  comment: string
  createdAt, updatedAt
}
```
- **Ràng buộc:** 1 appointment chỉ có 1 review, chỉ khi COMPLETED

#### Notification (`Notification`)
```typescript
{
  recipientId: ObjectId (ref: 'User', required, index)
  senderId: ObjectId (ref: 'User')
  type: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_COMPLETED' | 'SYSTEM'
  title: string
  message: string
  data: Mixed (thường chứa appointmentId)
  isRead: boolean (default: false)
  createdAt, updatedAt
}
```

#### HistoryLog (`HistoryLog`)
```typescript
{
  shopId: ObjectId (ref: 'Shop', required, index)
  actorId: ObjectId (ref: 'User')
  actorName: string
  action: 'CREATED_APPOINTMENT' | 'UPDATED_STATUS' | 'EDITED_SERVICES'
  details: string (mô tả hành động)
  createdAt                                    // Chỉ có createdAt, không updatedAt
}
```

---

### 2.4. Auth Flow Chi Tiết

#### Đăng ký (`POST /user/register`)
1. Nhận: `{ fullName, phoneNumber, password }` + optional `avatar` (file)
2. Kiểm tra định dạng `phoneNumber` (chỉ gồm 10-11 chữ số)
3. Kiểm tra user tồn tại qua `phoneNumber`
4. Hash password (bcrypt, saltRounds=10)
5. Upload avatar lên Cloudinary (nếu có)
6. Tạo user mới với role mặc định `CUSTOMER`
7. Tạo JWT token (payload: `{ id, role, fullName, shopId }`, hết hạn 30 ngày)
8. Trả về: `{ message, token, user: { id, fullName, phoneNumber, role, avatar } }`

#### Đăng nhập (`POST /user/login`)
1. Nhận: `{ phoneNumber, password }`
2. Tìm user theo `phoneNumber`
3. So sánh password (bcrypt.compare)
4. Tạo JWT token
5. Trả về: `{ message, token, user: {...} }`

#### Google Login (`POST /user/google`)
1. Nhận: `{ idToken }` (Google ID Token)
2. Verify với Google OAuth2 Client
3. Tìm user theo `googleId` hoặc `email`
4. Nếu có: cập nhật nếu thiếu googleId/email
5. Nếu chưa: tạo user mới với role `CUSTOMER`
6. Tạo JWT token và trả về

#### Middleware Auth
- `verifyToken`: Bắt buộc, check JWT trong header `Authorization: Bearer <token>`
- `attachUser`: Soft check, không bắt buộc (gắn user nếu có token)
- `verifyRole(roles)`: Check quyền (VD: `verifyRole(['MANAGER', 'ADMIN'])`)

#### Phân quyền (Authorization) trong Controllers
- **MANAGER/ADMIN:** Tạo shop, thêm service, xem/đổi status appointment của shop
- **STAFF:** Xem appointment của shop mình, đổi status, thay đổi dịch vụ
- **CUSTOMER:** Đặt lịch, xem lịch của mình, hủy lịch, review
- **ADMIN:** Full quyền tất cả

---

### 2.5. Booking Logic Chi Tiết (`createAppointment`)

1. **Validate Shop** — tồn tại
2. **Check existing active booking** — customer không được có lịch PENDING/CONFIRMED khác
3. **Validate Services** — tồn tại, active, thuộc đúng shop
4. **Tính giá & thời lượng:**
   - Cộng tổng duration từ các service
   - Cộng tổng price
   - Nếu barber là MANAGER: thêm `managerExtraFee` cho mỗi service
5. **Tính endTime:** `bookingDate + totalDuration * 60000`
6. **Check Availability (Overlap):**
   - Nếu có barberId: kiểm tra barber có lịch trùng không (overlap time với status PENDING/CONFIRMED)
   - Nếu không có barberId: kiểm tra shop capacity (đếm concurrent appointments vs total active barbers)
7. **Tạo appointment:**
   - Tự tạo `bookingCode`: `#BH-` + 4 ký tự cuối của ObjectId
   - Customer mặc định là người đăng nhập
   - Nếu staff/manager tạo hộ (isManual): có thể chọn customer hoặc walk-in
8. **Ghi HistoryLog** — action `CREATED_APPOINTMENT`
9. **Gửi Notification:**
   - Tạo DB notification cho manager shop
   - Emit socket event (`new_notification`) tới room của manager
   - Gửi FCM push notification tới manager (nếu có fcmToken)
10. **Trả về:** `{ message, appointment }`

### 2.6. Slot Calculation Logic (`getAvailableSlots`)

1. Lấy shop config (openTime, closeTime, breakStart, breakEnd, slotDuration)
2. Đếm tổng capacity (tổng số staff/manager active trong shop, hoặc 1 nếu chọn barber cụ thể)
3. Sinh danh sách slots theo slotDuration từ openTime đến closeTime (dùng timezone Vietnam +07:00)
4. Đánh dấu slots trong giờ nghỉ là unavailable
5. Query appointments PENDING/CONFIRMED trong ngày
6. Với mỗi slot, đếm số appointment overlap
7. `available = (overlapCount < totalCapacity)`

---

### 2.7. Các Service External

#### Socket.io (`utils/socket.ts`)
- Init với CORS allow all origins
- Client join room bằng socket event `join_room` (gửi userId)
- Server emit `new_notification` tới room của userId
- Dùng trong appointment controller để gửi notification realtime

#### Firebase FCM (`services/notification.service.ts`)
- Hàm `sendPushNotification({ token, title, body, data })`
- Dùng Firebase Admin SDK để gửi push qua FCM token

#### Cloudinary (`config/cloudinary.config.ts` + `config/multer.config.ts`)
- Upload ảnh/video qua `multer-storage-cloudinary`
- Folder: `bhair_app`, public_id: `fieldname-timestamp`
- Hỗ trợ format: jpg, png, jpeg, webp (ảnh), mp4, webm, mov (video)

#### AI - Google Gemini (`services/ai.service.ts`)
- Model: `gemini-2.5-flash`
- Phân tích khuôn mặt: face_shape (Oval/Round/Square/Heart/Oblong/Diamond), skin_tone, scores
- Gợi ý kiểu tóc, mô tả, tránh, màu nhuộm, advice_text (Markdown)
- Response schema strict JSON
- Timeout 60s cho request AI

---

## 🖥️ 3. FRONTEND WEB (`web/`) — Chi Tiết

### 3.1. Cấu trúc thư mục

```
web/
├── index.html
├── package.json
├── vite.config.ts              # Vite config + proxy /api → localhost:1000
├── vercel.json                 # Deploy config
├── public/
└── src/
    ├── main.tsx                # Entry: ReactDOM + GoogleOAuthProvider
    ├── App.tsx                 # App gốc Vite template (không dùng)
    ├── index.css, App.css      # Styles
    ├── api/                    # API layer (Axios)
    │   ├── index.ts            # Axios instance + interceptors
    │   ├── auth.api.ts         # Auth API calls
    │   ├── shop.api.ts         # Shop/Search/Slots API calls
    │   ├── appointment.api.ts  # Appointment API calls
    │   └── hairstyle.api.ts    # AI API calls (axios riêng, timeout 60s)
    ├── store/                  # State management (Zustand)
    │   ├── useAuthStore.ts     # Auth state (user, token, login, logout)
    │   └── useThemeStore.ts    # Theme & language state
    ├── router/
    │   └── index.tsx           # AppRouter: BrowserRouter + Routes
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx    # Bottom nav (mobile) + Sidebar (desktop)
    │   │   └── ProtectedRoute.tsx # Route guard với allowedRoles
    │   └── map/                # Map components
    ├── pages/
    │   ├── public/
    │   │   ├── LandingPage.tsx # Landing page giới thiệu (trang chủ gốc)
    │   │   └── LandingPage.css # Styles cho Landing page
    │   ├── auth/
    │   │   ├── LoginPage.tsx   # Login form + Google OAuth
    │   │   └── RegisterPage.tsx # Register form + role selector
    │   ├── customer/
    │   │   ├── HomePage.tsx
    │   │   ├── SearchPage.tsx
    │   │   ├── AppointmentsPage.tsx
    │   │   ├── AppointmentDetailPage.tsx
    │   │   ├── SettingsPage.tsx
    │   │   └── HairstyleAdvisorPage.tsx
    │   ├── manager/
    │   │   ├── ManagerAppointmentsPage.tsx
    │   │   └── MyShopsPage.tsx
    │   ├── staff/
    │   │   └── StaffAppointmentsPage.tsx
    │   └── shop/
    │       ├── ShopDetailPage.tsx
    │       └── BookingPage.tsx
    ├── hooks/
    │   ├── useTranslation.ts   # i18n hook (vi/en)
    │   └── useGeolocation.ts   # GPS hook
    ├── locales/
    │   ├── vi.ts               # Vietnamese translations
    │   └── en.ts               # English translations
    ├── types/
    │   └── index.ts            # TypeScript interfaces
    └── utils/
        └── format.ts           # Formatter helpers
```

### 3.2. Router Architecture

**Base:** `BrowserRouter` trong `AppRouter`

**Phân chia theo role tự động:**
- `CUSTOMER`: Home (`/home`), Search (`/search`), Hairstyle Advisor (`/hairstyle`), Appointments (`/appointments`), Settings (`/settings`)
- `MANAGER / ADMIN`: Manager Appointments (`/manager/appointments`), My Shops (`/manager/shops`), Settings (`/settings`)
- `STAFF`: Staff Appointments (`/staff/appointments`), Settings (`/settings`)
- **Public:** Landing Page (`/`), Login (`/login`), Register (`/register`)

**KeepAlive Tabs Pattern:**
- Các tab route (list ở trên) được render đồng thời qua `KeepAliveTabs`, chỉ hiển thị tab active bằng `display: block / none`
- Các non-tab routes (shop detail, booking, appointment detail) được render qua `<Routes>` thông thường
- Mỗi tab route bọc trong `<AppShell>` để có bottom nav

**Route Guards:**
- `LandingPage` (`/`): Đóng vai trò route gốc. Nếu chưa đăng nhập sẽ hiển thị Landing Page, nếu đã đăng nhập sẽ tự động redirect theo role.
- `ProtectedRoute`: Check auth + role, redirect nếu không đủ quyền
- Logic redirect trong `KeepAliveTabs`: Ngăn user truy cập route của role khác

### 3.3. State Management (Zustand)

#### `useAuthStore`
```typescript
{
  user: User | null
  token: string | null
  isLoading: boolean
  login(user, token): void      // Lưu vào localStorage + set state
  logout(): void                 // Xóa localStorage + reset state
  restoreToken(token, user): void // Khôi phục từ localStorage
}
```
- **Khởi tạo:** Đọc `userToken` và `userData` từ localStorage khi app load
- **Token storage:** `localStorage.getItem('userToken')`

#### `useThemeStore`
- Quản lý dark mode và language (vi/en)

### 3.4. API Layer

#### Axios Instance (`api/index.ts`)
```typescript
const axiosInstance = axios.create({
  baseURL: API_URL,          // VITE_API_URL || 'https://be-bhair.onrender.com/api/v1'
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
```
- **Request interceptor:** Tự động gắn `Authorization: Bearer <token>` từ localStorage
- **Response interceptor:** Tự động xóa token và dispatch `auth:logout` khi 401

#### Separate AI Axios (`api/hairstyle.api.ts`)
- BaseURL: `${API_URL}/ai`, timeout: 60s (vì AI cần xử lý lâu)

### 3.5. TypeScript Types (`web/src/types/index.ts`)

```typescript
type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'STAFF'

interface User { _id, phoneNumber, fullName, role, avatar?, shopId?, createdAt, updatedAt }
interface Shop { _id, name, address, phone, images1/2/3, videos, openTime, closeTime, slotDuration, managerId, location?, averageRating? ... }
interface Service { _id, shopId, name, price, duration, managerExtraFee? ... }
interface Barber { _id, fullName, avatar?, phoneNumber? }
interface Appointment { _id, shopId, customerId, barberId, serviceIds, bookingDate, status, totalPrice, note?, customerName?, customerPhone? ... }
interface TimeSlot { time, available, bookedCount, totalCapacity }
interface Review { _id, appointmentId, userId, rating, comment, createdAt }
interface AuthResponse { user: User, token: string }
```

### 3.6. i18n System
- Hook `useTranslation()` lấy `language` từ `useThemeStore`
- Key-based: `t('auth.loginFailed')` → tra cứu trong object lồng
- 2 ngôn ngữ: `vi.ts` (Tiếng Việt - mặc định), `en.ts` (English)

### 3.7. Key Features

| Feature | Mô tả | Trang |
|---|---|---|
| **Landing Page** | Giới thiệu chung dự án cho khách truy cập chưa đăng nhập | LandingPage |
| **Login/Register** | Phone + password hoặc Google OAuth | LoginPage, RegisterPage |
| **Tìm kiếm shop** | Keyword + geolocation (radius filter) | SearchPage |
| **Xem shop** | Chi tiết: ảnh, map, services, staff, reviews, giờ mở cửa | ShopDetailPage |
| **Đặt lịch** | Chọn service → chọn ngày → chọn slot → chọn barber → confirm | BookingPage |
| **Quản lý lịch** | Xem / hủy lịch (customer), đổi status (staff/manager) | AppointmentsPage, ManagerAppointmentsPage, StaffAppointmentsPage |
| **AI Tư vấn** | Chụp ảnh khuôn mặt → AI phân tích → gợi ý kiểu tóc | HairstyleAdvisorPage |
| **Đánh giá** | Rating 1-5 + comment sau khi hoàn thành | AppointmentDetailPage |
| **i18n** | Hỗ trợ Tiếng Việt + English | Toàn app |
| **Dark mode** | Toggle dark/light theme | SettingsPage |
| **Push Notification** | FCM + Socket.io realtime | (Cần app mobile để nhận push) |

#### 3.7.1. Landing Page (Kiến trúc Mới)
- **Giao diện (Aesthetic):** Dark Theme cực kỳ sang trọng (chữ Vàng/Đồng `#c49b66` trên nền đen tuyền), phông chữ `Plus Jakarta Sans`, định hướng trải nghiệm "Độc Bản & Đẳng Cấp".
- **Hiệu ứng Scroll:** Sử dụng thư viện `lenis` cho Smooth Scrolling tự do (Free smooth scroll). Toàn bộ thuật toán nam châm cũ đã được loại bỏ để nhường chỗ cho thao tác cuộn mượt mà tự nhiên.
- **Particle Physics Engine:** Tích hợp Canvas tự code để vẽ hàng trăm hạt ánh sáng 3D. Các hạt tương tác đẩy lùi khi có chuột (Repulsion) và có hiệu ứng gió 3D (Parallax Wind) đẩy các hạt to bay nhanh hơn hạt nhỏ khi cuộn trang.
- **GSAP Animations:** 
  - Hiệu ứng Universal "Pop-up Fade In" (`.ag-fade-up`) cho toàn bộ thành phần (Cards, Title, Button) với gia tốc nảy `back.out(1.5)` khi cuộn chạm mốc 90% màn hình.
  - Hiệu ứng Hero Scrub Animation: Chữ mờ và bay dần lên khi bắt đầu cuộn xuống.
- **Cấu trúc 5 phân đoạn:**
  1. Hero: Tiêu đề B_Hair + CTA.
  2. Kiến Tạo Trải Nghiệm (Tính năng): 3 thẻ giới thiệu công nghệ (AI, Booking realtime).
  3. Khách Hàng Nói Gì (Mock Reviews): Grid 3 thẻ kính mờ (Glassmorphism) với đánh giá 5 sao.
  4. Không Gian Độc Bản (Gallery): Bố cục Masonry 4 ảnh với Cinematic effect (từ xám Grayscale sang ảnh màu sắc nét khi hover).
  5. Sẵn Sàng Thay Đổi (Footer).

---

### 3.8. External Libraries (FE)

| Package | Dùng cho |
|---|---|
| `react-router-dom` v7 | Routing, lazy loading |
| `@react-oauth/google` | Google Sign-In button |
| `@react-google-maps/api` | Google Maps hiển thị |
| `axios` | HTTP requests |
| `zustand` | State management |
| `vite` v8 | Build tool |
| `@vitejs/plugin-react` | React plugin cho Vite |

---

## 📡 4. CÁC CÔNG NGHỆ / DỊCH VỤ NGOÀI

| Dịch vụ | Mục đích | Config (env vars) |
|---|---|---|
| **MongoDB** | Database chính | `MONGODB_URI` |
| **Cloudinary** | Lưu trữ ảnh/video | `CLOUDINARY_URL` |
| **Firebase Admin** | Push notification FCM | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| **Google OAuth2** | Social login | `GOOGLE_CLIENT_ID_ANDROID`, `GOOGLE_CLIENT_ID_WEB`, `GOOGLE_CLIENT_ID_IOS` |
| **Google Gemini** | AI phân tích khuôn mặt | `GEMINI_API_KEY` |
| **JWT** | Authentication tokens | `JWT_SECRET` |
| **Socket.io** | Real-time notifications | (Không cần config, CORS allow all) |

---

## 📦 5. DỮ LIỆU MẪU (`mongo_data/` + `scripts/seed.ts`)

### Seed data tự động tạo:
- **1 Admin:** phone `0901234567`, pass `123456`
- **5 Customers:** phone `0900000001` → `0900000005`, pass `123456`
- **Shop A (30Shine Cầu Giấy):** 1 Manager + 2 Staff (capacity=3), 2 Services, slot 30 phút
- **Shop B (Barber House Vintage Đà Nẵng):** 1 Manager (capacity=1), 1 Service, slot 60 phút
- **2 Appointments:** Tại shop A, 09:00 (2/3 slots booked → vẫn available 1 slot)
- **1 Completed Appointment + Review** (5 sao)
- **1 Notification** cho Manager A

### Run seed:
```bash
npm run seed
```

---

## 🚀 6. CÁCH CHẠY DỰ ÁN

### Backend
```bash
# Cài đặt dependencies
npm install

# Development (với nodemon)
npm run dev

# Build production
npm run build

# Start production
npm start

# Seed database
npm run seed
```

### Frontend Web
```bash
cd web
npm install
npm run dev          # Chạy dev server (Vite)
npm run build        # Build production
npm run preview      # Preview production build
```

---

## 📝 7. CÁC LƯU Ý / KNOWN ISSUES

1. ~~**Vite config proxy** trỏ tới `http://localhost:3000` nhưng BE chạy port 1000.~~ ✅ **Đã sửa 19/06/2026** — proxy target đổi thành `http://localhost:1000`.
2. **Appointment model** thiếu `bookingCode` auto-generate trong schema (chỉ có trong controller). Nếu tạo trực tiếp từ DB sẽ thiếu.
3. **Review model** lưu `userId` trong FE types nhưng BE dùng `customerId`.
4. **Hairstyle API** có `analyzeFace` response trả về `images.original` là base64, nhưng mobile/web parse khác nhau (BE trả base64, FE cần xử lý).
5. **Shop model** chia trường lưu ảnh làm 3: `images1` (ảnh bìa), `images2` (album ảnh tự do), và `images3` (chưa sử dụng). Không có trường `images` tổng hợp.
6. **Google Client IDs** cần config 3 audience (ANDROID, WEB, IOS) — nếu thiếu sẽ log error nhưng vẫn hoạt động nếu có ít nhất 1.
7. **Socket connection** chưa có auth — client có thể join bất kỳ room nào bằng userId.
8. **slot.route.ts** mount tại `/api/v1` nhưng route path là `/shop/:shopId/slots` → full path: `/api/v1/shop/:shopId/slots` (chú ý: route trong `server.ts` không có prefix `/shop`).
9. **App.tsx** là file template mặc định của Vite, không được dùng. Router handle tất cả.
10. **Google OAuth "no registered origin":** Nếu gặp lỗi này, vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID Web (`GOOGLE_CLIENT_ID_WEB`) → thêm **Authorized JavaScript origins**: `http://localhost:5173` (dev) và `https://web-b-hair.vercel.app` (production). BE đã có error handler phân loại lỗi này và trả về message hướng dẫn chi tiết.

---

## 📊 8. DATA FLOW TỔNG QUAN

```
┌─────────────┐      HTTP/REST       ┌──────────────┐      Mongoose      ┌──────────┐
│   Web FE    │ ◄──────────────────► │  Express API  │ ◄───────────────► │ MongoDB  │
│  (React)    │    JSON + JWT        │  (Node.js)    │                    │          │
└──────┬──────┘                      └──────┬───────┘                    └──────────┘
       │                                    │
       │ Google OAuth                       │ Google OAuth2 verify
       ▼                                    ▼
┌──────────┐                        ┌──────────────┐
│  Google  │                        │  Cloudinary   │ ◄── Upload ảnh/video
└──────────┘                        └──────────────┘
                                           │
                                           │ Socket.io (WebSocket)
                                           ▼
                                    ┌──────────────┐     FCM      ┌──────────┐
                                    │  Notifications│ ◄──────────► │ Firebase │
                                    │  (real-time)  │              └──────────┘
                                    └──────────────┘
                                           │
                                           │ Google GenAI (Gemini)
                                           ▼
                                    ┌──────────────┐
                                    │  AI Analysis │
                                    │  (khuôn mặt) │
                                    └──────────────┘
```

---

## 🤖 9. AI CODING RULES (3 tầng — tiết kiệm token)

| File | Khi load | Nội dung |
|---|---|---|
| `.github/copilot-instructions.md` | Luôn luôn | Core: doc, no-hardcode, no-mock, **output rules**, API format, known issues |
| `.github/instructions/be.instructions.md` | Sửa `src/**` | BE: architecture, auth, DB, external services, code style |
| `.github/instructions/fe.instructions.md` | Sửa `web/src/**` | FE: architecture, auth, i18n, types sync, code style |
| `.github/skills/update-docs/SKILL.md` | Gọi `/update-docs` | Cập nhật DOCUMENTATION.md sau code change |

### 🎯 Output rules (quan trọng)
- **Code trước, giải thích sau** — ưu tiên edits, chỉ giải thích khi hỏi.
- **Dùng `// ...existing code...`** thay vì copy nguyên file.
- **Mỗi response 1 hành động chính.**
- **TypeScript strict** — không `any`, dùng type từ `types/`.
- **Sau sửa:** chạy `get_errors` kiểm tra.

---

*Tài liệu cập nhật: 19/06/2026 — Dự án B_Hair*