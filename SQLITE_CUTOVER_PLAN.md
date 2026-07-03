# Kế Hoạch Cutover: Backend SQLite trên Android

## Mục tiêu
- ✅ Backend cũ (MongoDB Atlas) trên Render.com: **GIỮ NGUYÊN**
- ✅ Backend cũ trên điện thoại: **XÓA KHỎI PM2** (giữ code để backup)
- ✅ Backend mới (SQLite) trên điện thoại: **CHẠY PORT 3000**

---

## Phase 1: Setup Backend mới (30 phút)

### 1.1. Copy project sang folder mới
```bash
# Trên điện thoại
cd /root
cp -r BE_BHair BE_BHair_SQLite

cd BE_BHair_SQLite
```

### 1.2. Copy database SQLite
```bash
# Copy database đã migrate
cp /root/BE_BHair/bhair.db /root/BE_BHair_SQLite/bhair.db

# Verify
sqlite3 bhair.db "SELECT COUNT(*) FROM users;"
# Output: 33
```

### 1.3. Update .env
```bash
nano .env

# Comment out MongoDB
# MONGODB_URI=mongodb+srv://...

# Add SQLite
DATABASE_TYPE=sqlite
DATABASE_PATH=/root/BE_BHair_SQLite/bhair.db

# Đảm bảo port vẫn là 3000
PORT=3000
```

### 1.4. Cài dependencies
```bash
# Better-sqlite3 đã có rồi từ lúc migrate
npm list better-sqlite3

# Nếu chưa có:
npm install better-sqlite3
```

---

## Phase 2: Update Backend Code (1-2 giờ)

### 2.1. Tạo SQLite config
```bash
# Tạo file config mới
nano dist/config/sqlite.config.js
```

Nội dung:
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../bhair.db');
const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  fileMustExist: true 
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ Connected to SQLite:', dbPath);

module.exports = db;
```

### 2.2. Update database connection
```bash
nano dist/config/database.js
```

Thay thế:
```javascript
// OLD: MongoDB
const mongoose = require('mongoose');
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
};

// NEW: SQLite (no connection needed, just require)
const db = require('./sqlite.config');
const connectDB = async () => {
  console.log('✅ Using SQLite database');
  // SQLite connection is synchronous, already connected in sqlite.config.js
};
```

### 2.3. Update models (VD: User model)
```bash
nano dist/models/user.model.js
```

Thay thế Mongoose bằng SQLite queries:
```javascript
// OLD: Mongoose
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({...});
module.exports = mongoose.model('User', UserSchema);

// NEW: SQLite
const db = require('../config/sqlite.config');

class User {
  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }
  
  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  
  static findByPhoneNumber(phone) {
    return db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phone);
  }
  
  static create(userData) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO users (
        id, phone_number, password, email, google_id, 
        full_name, role, avatar, is_active, shop_id, fcm_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userData.phoneNumber || null,
      userData.password || null,
      userData.email || null,
      userData.googleId || null,
      userData.fullName,
      userData.role || 'CUSTOMER',
      userData.avatar || '',
      userData.isActive !== false ? 1 : 0,
      userData.shopId || null,
      userData.fcmToken || null
    );
    
    return this.findById(id);
  }
  
  static update(id, updates) {
    const fields = [];
    const values = [];
    
    const fieldMap = {
      fullName: 'full_name',
      phoneNumber: 'phone_number',
      googleId: 'google_id',
      isActive: 'is_active',
      shopId: 'shop_id',
      fcmToken: 'fcm_token',
      barberProfile: 'barber_profile'
    };
    
    Object.keys(updates).forEach(key => {
      const dbField = fieldMap[key] || key;
      if (key === 'barberProfile') {
        fields.push(`${dbField} = ?`);
        values.push(JSON.stringify(updates[key]));
      } else if (key === 'isActive') {
        fields.push(`${dbField} = ?`);
        values.push(updates[key] ? 1 : 0);
      } else {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    });
    
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }
  
  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }
  
  static findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }
    
    if (filters.shopId) {
      query += ' AND shop_id = ?';
      params.push(filters.shopId);
    }
    
    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }
    
    return db.prepare(query).all(...params);
  }
}

module.exports = User;
```

### 2.4. Update controllers (VD: Auth controller)
```bash
nano dist/controllers/auth.controller.js
```

Sửa các chỗ dùng Mongoose methods:
```javascript
// OLD
const user = await User.findOne({ email });
const newUser = new User({ email, password });
await newUser.save();

// NEW
const user = User.findByEmail(email);
const newUser = User.create({ email, password });
```

### 2.5. Tương tự cho các models khác
- `dist/models/shop.model.js`
- `dist/models/service.model.js`
- `dist/models/appointment.model.js`
- `dist/models/reviews.model.js`
- `dist/models/notification.model.js`
- `dist/models/history.model.js`

---

## Phase 3: Testing (30 phút)

### 3.1. Test chạy server
```bash
cd /root/BE_BHair_SQLite

# Test run (không dùng PM2)
node dist/server.js

# Kiểm tra:
# - ✅ Server khởi động thành công
# - ✅ SQLite connected
# - ✅ Không có lỗi
# Ctrl+C để dừng
```

### 3.2. Test API endpoints
```bash
# Test health check
curl http://localhost:3000/api/health

# Test get users
curl http://localhost:3000/api/users

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### 3.3. Nếu có lỗi
- Đọc logs để xác định model nào còn dùng Mongoose
- Fix từng model theo pattern ở Phase 2.3
- Test lại

---

## Phase 4: Cutover Production (10 phút)

### 4.1. Stop BE cũ
```bash
# Xem danh sách PM2
pm2 ls

# Stop và xóa BE cũ
pm2 stop BE_BHair
pm2 delete BE_BHair

# Verify port 3000 đã free
lsof -i :3000
```

### 4.2. Start BE mới
```bash
cd /root/BE_BHair_SQLite

# Start với PM2
pm2 start dist/server.js --name "BE_BHair_SQLite"

# Save config
pm2 save

# Kiểm tra
pm2 ls
pm2 logs BE_BHair_SQLite
```

### 4.3. Test qua Cloudflare Tunnel
```bash
# Tunnel vẫn trỏ localhost:3000 (không đổi gì)
curl https://api.bhair.site/api/health
```

### 4.4. Monitor
```bash
# Xem logs real-time
pm2 logs BE_BHair_SQLite

# Xem memory usage
pm2 monit
```

---

## Phase 5: Cleanup (Sau 1-2 ngày test ổn định)

### 5.1. Backup BE cũ
```bash
# Nén lại để backup
cd /root
tar -czf BE_BHair_backup_$(date +%Y%m%d).tar.gz BE_BHair/

# Copy sang sdcard
cp BE_BHair_backup_*.tar.gz /sdcard/Download/Phuc_Data/backups/
```

### 5.2. Xóa folder cũ (optional)
```bash
# Sau khi chắc chắn BE mới chạy OK
rm -rf /root/BE_BHair
```

---

## Rollback Plan (Nếu có vấn đề)

### Quay lại BE cũ (MongoDB)
```bash
# Stop BE mới
pm2 stop BE_BHair_SQLite
pm2 delete BE_BHair_SQLite

# Start lại BE cũ
cd /root/BE_BHair
pm2 start dist/server.js --name "BE_BHair"
pm2 save

# Verify
curl http://localhost:3000/api/health
```

---

## So sánh Kiến trúc

### Trước (Hiện tại)
```
┌──────────────────────────────────────────┐
│ Render.com (Production)                  │
│ - Backend: MongoDB Atlas                 │
│ - Domain: render-url.onrender.com        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Android Server (Development/Staging)     │
│ /root/BE_BHair                            │
│ - Backend: MongoDB Atlas (same as Render)│
│ - Port: 3000                              │
│ - Domain: api.bhair.site                  │
│ - PM2: BE_BHair                           │
└──────────────────────────────────────────┘
```

### Sau (Mục tiêu)
```
┌──────────────────────────────────────────┐
│ Render.com (Production)                  │
│ - Backend: MongoDB Atlas                 │ ← KHÔNG ĐỔI
│ - Domain: render-url.onrender.com        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Android Server (Independent Production)  │
│ /root/BE_BHair_SQLite                     │
│ - Backend: SQLite local                   │ ← MỚI
│ - Port: 3000                              │
│ - Domain: api.bhair.site                  │
│ - PM2: BE_BHair_SQLite                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Backup (Inactive)                         │
│ /root/BE_BHair                            │ ← GIỮ ĐỂ BACKUP
│ - Không chạy trên PM2                     │
└──────────────────────────────────────────┘
```

---

## Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Setup folder mới | 30 min |
| 2 | Update code | 1-2 giờ |
| 3 | Testing | 30 min |
| 4 | Cutover | 10 min |
| 5 | Monitor | 1-2 ngày |
| **Total** | | **2-3 giờ** |

---

## Checklist

### Trước khi bắt đầu
- [ ] Backup MongoDB data (đã có)
- [ ] SQLite database đã migrate (✅ done)
- [ ] SSH access ổn định

### Phase 1
- [ ] Copy project sang BE_BHair_SQLite
- [ ] Copy bhair.db
- [ ] Update .env

### Phase 2
- [ ] Tạo sqlite.config.js
- [ ] Update database.js
- [ ] Update tất cả models
- [ ] Update controllers nếu cần

### Phase 3
- [ ] Test chạy server
- [ ] Test API endpoints
- [ ] Fix lỗi (nếu có)

### Phase 4
- [ ] Stop BE cũ
- [ ] Start BE mới
- [ ] Test qua Cloudflare
- [ ] Monitor 24h

### Phase 5
- [ ] Backup BE cũ
- [ ] Xóa folder cũ (sau 1-2 ngày)

---

## Expected Results

### RAM Usage
- **Trước**: ~150 MB (Node.js + PM2)
- **Sau**: ~170 MB (Node.js + PM2 + SQLite)
- **Tăng**: ~20 MB

### Latency
- **Trước**: 50-150ms (MongoDB Atlas)
- **Sau**: <1ms (SQLite local)
- **Cải thiện**: 50-150x

### Dependencies
- **Trước**: MongoDB Atlas online
- **Sau**: Hoàn toàn độc lập
