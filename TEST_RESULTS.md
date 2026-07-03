# Backend Test Results (2026-07-03)

## Server Status
- ✅ Server đang chạy: `https://api.bhair.site`
- ✅ SQLite connected: "✅ Using SQLite database"
- ✅ Root endpoint: `API đang chạy...`

## API Endpoints Test

| Endpoint | Method | Status | Error |
|----------|--------|--------|-------|
| `/` | GET | ✅ 200 OK | - |
| `/api/v1/shop` | GET | ❌ 404 | Not Found |
| `/api/v1/service` | GET | ❌ 404 | Not Found |
| `/api/v1/user/login` | POST | ❌ 500 | Internal Server Error |

## Root Cause Analysis

### Vấn đề chính
Backend đã chuyển sang SQLite (`DATABASE_TYPE=sqlite`) nhưng **models vẫn dùng Mongoose syntax**, chưa được migrate.

### Ví dụ: User Model
**Hiện tại (Mongoose):**
```javascript
const user = await User.findOne({ phoneNumber });
const newUser = new User({ ... });
await newUser.save();
```

**Cần migrate thành (SQLite):**
```javascript
const user = User.findByPhoneNumber(phoneNumber);
const newUser = User.create({ ... });
```

### Models cần migrate
1. ❌ `src/models/user.model.ts` - Login đang fail
2. ❌ `src/models/shop.model.ts` - Shops endpoint 404
3. ❌ `src/models/service.model.ts` - Services endpoint 404
4. ❌ `src/models/appointment.model.ts`
5. ❌ `src/models/reviews.model.ts`
6. ❌ `src/models/notification.model.ts`
7. ❌ `src/models/history.model.ts`

## Next Steps

### Option 1: Complete SQLite Migration (Recommended)
Migrate all models theo pattern trong `SQLITE_CUTOVER_PLAN.md` Phase 2.

### Option 2: Temporary Rollback to MongoDB
Để test login trước, có thể tạm thời:
```bash
# Trên Android
nano .env
# Đổi DATABASE_TYPE=mongodb
pm2 restart BE_BHair_SQLite
```

## Test Scripts Created
- ✅ `test-api.ps1` - Quick health check
- ✅ `login-test.ps1` - Test login with custom credentials
- ✅ `test-all.ps1` - Test all major endpoints

### Usage
```powershell
# Quick test
powershell -File test-api.ps1

# Test login
powershell -File login-test.ps1 -phone "0987654321" -pass "yourpass"

# Test all endpoints
powershell -File test-all.ps1
```
