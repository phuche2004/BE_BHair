# Kế Hoạch Migration: Full Stack trên Android Server

## Tổng quan
Chuyển từ kiến trúc **"Backend on Phone + Atlas Cloud + Vercel Web"** sang **"Full Stack on Phone"**:
- ✅ Frontend (React/Vite) chạy trên điện thoại
- ✅ Backend (Node.js/Express) chạy trên điện thoại
- ✅ Database (SQLite) chạy trên điện thoại

---

## Kiến trúc Mới

### Domain & Port
```
https://bhair.site           → Frontend (React) - Port 3001
https://api.bhair.site       → Backend (Express) - Port 3000
```

### Cloudflare Tunnel Configuration
```bash
# Tunnel sẽ expose 2 services:
# 1. Frontend
cloudflared tunnel route dns bhair-ubuntu bhair.site
# Ingress: bhair.site → http://localhost:3001

# 2. Backend (đã có)
cloudflared tunnel route dns bhair-ubuntu api.bhair.site
# Ingress: api.bhair.site → http://localhost:3000
```

### File Structure
```
/root/BE_BHair/
├── dist/                    # Backend compiled (JS)
├── web/                     # Frontend source (React/Vite)
├── web_build/              # Frontend build output (static files)
├── bhair.db                # SQLite database
├── public/                 # Static assets
├── uploads/                # User uploads
└── .env                    # Environment variables
```

---

## Phase 1: Setup SQLite Database (1-2 giờ)

### 1.1. Cài đặt SQLite
```bash
# SSH vào điện thoại
ssh AndroidServer

# Vào Ubuntu chroot
su
/data/local/start_ubuntu.sh
cd /root/BE_BHair

# Cài SQLite
apt update
apt install sqlite3 -y

# Test
sqlite3 --version
```

### 1.2. Cài SQLite driver cho Node.js
```bash
npm install better-sqlite3
```

### 1.3. Tạo schema SQLite
File `scripts/init_sqlite.sql` đã được tạo dựa trên Mongoose models thực tế:

**Các bảng chính:**
- `users` - Thông tin user (ADMIN, MANAGER, STAFF, CUSTOMER)
- `shops` - Thông tin shop (location GeoJSON, subscription, scheduling)
- `services` - Dịch vụ của shop (price, duration, manager_extra_fee)
- `appointments` - Lịch đặt (service_ids JSON array, service_changes tracking)
- `reviews` - Đánh giá (rating 1-5, unique per appointment)
- `notifications` - Thông báo (5 types: BOOKING_CREATED, CONFIRMED, CANCELLED, COMPLETED, SYSTEM)
- `history_logs` - Lịch sử thay đổi (CREATED_APPOINTMENT, UPDATED_STATUS, EDITED_SERVICES)

**Tính năng đặc biệt:**
- Full-text search cho shops (FTS5 virtual table)
- Auto-update `updated_at` triggers
- Views: `v_upcoming_appointments`, `v_shop_stats`
- WAL mode enabled cho concurrency
- Indexes đầy đủ cho performance

Chi tiết schema xem file `scripts/init_sqlite.sql` (200+ dòng SQL)

### 1.4. Khởi tạo database
```bash
cd /root/BE_BHair
sqlite3 bhair.db < scripts/init_sqlite.sql

# Kiểm tra
sqlite3 bhair.db ".tables"
```

### 1.5. Export data từ MongoDB Atlas
```bash
# Chạy trên máy tính Windows (có MongoDB tools)
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/Bhair" --out=./atlas_backup

# Copy sang điện thoại qua Samba
# Từ máy tính:
xcopy /E /I atlas_backup Z:\Download\Phuc_Data\atlas_backup
```

### 1.6. Tạo script migration
File `scripts/migrate_mongo_to_sqlite.js` đã được tạo với đầy đủ logic migration:

**Tính năng:**
- Migrate 7 collections: users, shops, services, appointments, reviews, notifications, history_logs
- Convert ObjectId → String
- Convert Date → ISO 8601 string
- Convert nested objects → JSON strings
- Transaction support (rollback nếu lỗi)
- Verification & summary sau khi migrate

Chi tiết xem file `scripts/migrate_mongo_to_sqlite.js` (300+ dòng code)

**Hoặc xem code mẫu:**

**Hoặc xem code mẫu:**

```javascript
// Core logic (simplified)
const users = await mongodb.collection('users').find().toArray();
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (
    id, phone_number, password, email, google_id, full_name, 
    role, avatar, is_active, shop_id, fcm_token, barber_profile, 
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const user of users) {
  insertUser.run(
    user._id.toString(),
    user.phoneNumber || null,
    user.password || null,
    user.email || null,
    user.googleId || null,
    user.fullName,
    user.role || 'CUSTOMER',
    user.avatar || '',
    user.isActive !== false ? 1 : 0,
    user.shopId?.toString() || null,
    user.fcmToken || null,
    user.barberProfile ? JSON.stringify(user.barberProfile) : null,
    user.createdAt?.toISOString() || new Date().toISOString(),
    user.updatedAt?.toISOString() || new Date().toISOString()
  );
}
// ... tương tự cho các collections khác
```

### 1.7. Chạy migration
```bash
cd /root/BE_BHair
node scripts/migrate_mongo_to_sqlite.js
```

---

## Phase 2: Update Backend Code (2-3 giờ)

### 2.1. Tạo SQLite config
Tạo file `dist/config/sqlite.config.js`:

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../bhair.db');
const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false 
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

module.exports = db;
```

### 2.2. Update models
Thay thế Mongoose models bằng SQLite queries. Ví dụ `dist/models/user.model.js`:

```javascript
const db = require('../config/sqlite.config');
const { v4: uuidv4 } = require('uuid');

class User {
  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }
  
  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  
  static create(userData) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, phone, role, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userData.email,
      userData.password,
      userData.name || '',
      userData.phone || '',
      userData.role || 'customer',
      userData.avatar || ''
    );
    
    return this.findById(id);
  }
  
  static update(id, userData) {
    const fields = [];
    const values = [];
    
    Object.keys(userData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(userData[key]);
    });
    
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }
}

module.exports = User;
```

### 2.3. Update controllers
Controllers sử dụng models mới (không cần thay đổi nhiều logic).

### 2.4. Update .env
```bash
# Remove MongoDB
# MONGODB_URI=mongodb+srv://...

# Add SQLite
DATABASE_PATH=/root/BE_BHair/bhair.db
```

### 2.5. Test Backend
```bash
pm2 restart BE_BHair
pm2 logs BE_BHair

# Test API
curl http://localhost:3000/api/health
```

---

## Phase 3: Setup Frontend on Phone (1-2 giờ)

### 3.1. Build Frontend
```bash
# Trên máy tính (trong folder web/)
cd web
npm run build

# Output: web/dist/

# Copy build qua điện thoại
xcopy /E /I dist Z:\Download\Phuc_Data\web_build
```

### 3.2. Serve Frontend bằng Express
Tạo file `dist/server_web.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.WEB_PORT || 3001;
const buildPath = path.join(__dirname, '../web_build');

// Serve static files
app.use(express.static(buildPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend server running on port ${PORT}`);
});
```

### 3.3. Add to PM2
```bash
cd /root/BE_BHair

pm2 start dist/server_web.js --name "BHair_Web"
pm2 save
pm2 ls

# Output:
# ┌─────┬──────────────┬─────────┬───────┐
# │ id  │ name         │ status  │ port  │
# ├─────┼──────────────┼─────────┼───────┤
# │ 0   │ BE_BHair     │ online  │ 3000  │
# │ 1   │ tunnel       │ online  │ -     │
# │ 2   │ BHair_Web    │ online  │ 3001  │
# └─────┴──────────────┴─────────┴───────┘
```

---

## Phase 4: Configure Cloudflare Tunnel (30 phút)

### 4.1. Update Tunnel config
Tạo/Chỉnh sửa file `~/.cloudflared/config.yml`:

```yaml
tunnel: bhair-ubuntu
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend
  - hostname: bhair.site
    service: http://localhost:3001
  
  # Backend API
  - hostname: api.bhair.site
    service: http://localhost:3000
  
  # Catch-all
  - service: http_status:404
```

### 4.2. Add DNS record cho frontend
```bash
cloudflared tunnel route dns bhair-ubuntu bhair.site
```

### 4.3. Restart Tunnel
```bash
pm2 restart tunnel
pm2 logs tunnel

# Kiểm tra
curl https://bhair.site
curl https://api.bhair.site/api/health
```

---

## Phase 5: Update CI/CD (30 phút)

### 5.1. Update `.github/workflows/deploy.yml`
Thêm build web vào workflow:

```yaml
- name: Build Backend (TypeScript → JavaScript)
  run: npm run build

- name: Build Frontend (React → Static)
  run: |
    cd web
    npm install
    npm run build
    mv dist ../web_build
```

### 5.2. Update cleanup
```yaml
- name: Clean source files (keep artifacts only)
  run: |
    git rm -rf --ignore-unmatch src/ mobile/ tsconfig.json package*.json
    # Keep web_build instead of web/
    git rm -rf --ignore-unmatch web/
```

### 5.3. Update webhook endpoint
Script trên điện thoại nhận webhook:

```bash
#!/bin/bash
# /root/BE_BHair/scripts/deploy.sh

cd /root/BE_BHair

echo "📥 Pulling latest code..."
git pull origin production

echo "🔄 Restarting services..."
pm2 restart BE_BHair
pm2 restart BHair_Web

echo "✅ Deployment completed!"
```

---

## Phase 6: Testing & Rollout (1 giờ)

### 6.1. Health checks
```bash
# Backend
curl https://api.bhair.site/api/health

# Frontend
curl https://bhair.site

# Database
sqlite3 /root/BE_BHair/bhair.db "SELECT COUNT(*) FROM users;"
```

### 6.2. Performance monitoring
```bash
# RAM usage
free -h

# PM2 monitoring
pm2 monit

# SQLite size
ls -lh /root/BE_BHair/bhair.db
```

### 6.3. Backup strategy
```bash
# Tạo cron job backup database
crontab -e

# Backup mỗi ngày 2AM
0 2 * * * sqlite3 /root/BE_BHair/bhair.db ".backup /sdcard/Download/Phuc_Data/backups/bhair_$(date +\%Y\%m\%d).db"

# Xóa backup cũ hơn 7 ngày
0 3 * * * find /sdcard/Download/Phuc_Data/backups/ -name "bhair_*.db" -mtime +7 -delete
```

---

## Rollback Plan

Nếu có vấn đề:

### 1. Quay lại MongoDB Atlas
```bash
# Restore .env
MONGODB_URI=mongodb+srv://...

# Revert code
git checkout <COMMIT_BEFORE_MIGRATION>
pm2 restart BE_BHair
```

### 2. Restore Vercel Web
```bash
# Push lại nhánh main để trigger Vercel
git push origin main
```

---

## Timeline Tổng

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Setup SQLite | 1-2h |
| 2 | Update Backend | 2-3h |
| 3 | Setup Frontend | 1-2h |
| 4 | Configure Tunnel | 30min |
| 5 | Update CI/CD | 30min |
| 6 | Testing | 1h |
| **Total** | | **6-9 giờ** |

---

## Expected Results

### Before (Hiện tại)
- **Backend**: Điện thoại (80-120 MB RAM)
- **Database**: MongoDB Atlas (Cloud - 0 MB RAM, 50-150ms latency)
- **Frontend**: Vercel (Cloud)
- **Total RAM**: ~150-200 MB

### After (Sau migration)
- **Backend**: Điện thoại (80-120 MB RAM)
- **Database**: SQLite (10-20 MB RAM, <1ms latency)
- **Frontend**: Điện thoại (20-30 MB RAM)
- **Total RAM**: ~200-280 MB

### Ưu điểm
- ✅ **Độc lập hoàn toàn**: Không phụ thuộc dịch vụ ngoài
- ✅ **Latency thấp**: <1ms thay vì 50-150ms
- ✅ **Chi phí 0đ**: Không cần Atlas, Vercel
- ✅ **Đơn giản hóa**: 1 server thay vì 3 services
- ✅ **Backup dễ**: Copy file .db

### Nhược điểm
- ⚠️ **RAM tăng**: +50-80 MB (vẫn OK với 4-6GB RAM)
- ⚠️ **Single point of failure**: Điện thoại down = toàn bộ hệ thống down
- ⚠️ **Không scale**: SQLite không phù hợp >10000 users đồng thời

---

## Next Steps

1. Review kế hoạch này
2. Backup toàn bộ data hiện tại
3. Test migration trên môi trường dev trước
4. Chạy migration trên production vào lúc ít traffic (2-4AM)
5. Monitor 24h đầu tiên
