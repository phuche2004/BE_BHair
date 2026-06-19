---
description: "Backend coding rules for B_Hair Express API. Use when: creating/modifying src/ files — models, controllers, routes, middleware, services, config. Covers architecture, auth, database, external services, code style."
applyTo: "src/**"
---
# BE — B_Hair API Rules

## 🏗️ Architecture
- `models/*.model.ts` — Mongoose schema (không business logic).
- `controllers/*.controller.ts` — Business logic (không route).
- `routes/*.route.ts` — Express router (chỉ mount controller).
- `middlewares/` — Auth, validation.
- `services/` — External (FCM, AI).
- `config/` — DB, Cloudinary, Firebase, Multer.

## 🔐 Auth
- JWT middleware: `verifyToken` (bắt buộc), `verifyRole(roles)`, `attachUser` (soft).
- Token payload: `{ id, role, fullName, shopId }`, 30d expiry.
- Phân quyền: MANAGER/ADMIN tạo shop/service; STAFF xem/đổi status; CUSTOMER đặt lịch/review.

## 🗄️ Database
- Mongoose ODM. Indexes: `phoneNumber`, `email`, `googleId`, `shopId`, `location:2dsphere`.
- Booking flow: PENDING→CONFIRMED→COMPLETED. Cancel tại PENDING/CONFIRMED.
- Google login: `User.googleId` (sparse unique) + `email`.

## 📡 External
| Service | File |
|---|---|
| MongoDB | `config/database.ts` |
| Cloudinary | `config/cloudinary.config.ts` + `config/multer.config.ts`, folder `bhair_app` |
| Firebase FCM | `services/notification.service.ts` → `sendPushNotification()` |
| Google OAuth2 | `google-auth-library` → `client.verifyIdToken()` |
| Google Gemini | `services/ai.service.ts`, model `gemini-2.5-flash`, timeout 60s |
| Socket.io | `utils/socket.ts` → `initSocket()`, room=userId |

## 📝 Code Style
- 4-space indent. Try-catch all controllers.
- HTTP: 200|201|400|401|403|404|409|500.
- Response: `{ message, data }` | `{ message, token, user }` | `{ message, error }`.
