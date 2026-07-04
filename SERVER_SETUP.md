# Server Setup Guide - Android/Termux

## Database Configuration

Database file (`bhair.db`) **KHÔNG được commit vào Git** và phải được quản lý riêng trên server.

### Setup trên Server Android

```bash
# 1. SSH vào server
ssh your-server

# 2. Đảm bảo database file tồn tại tại vị trí cố định
# Database nên nằm NGOÀI thư mục code để không bị xóa khi deploy
mkdir -p /root/data
# Nếu đã có db trong /root/BE_BHair_SQLite/, di chuyển:
mv /root/BE_BHair_SQLite/bhair.db /root/data/bhair.db
# Hoặc copy để backup:
cp /root/BE_BHair_SQLite/bhair.db /root/data/bhair.db

# 3. Tạo/cập nhật file .env trong thư mục deploy
cd /root/BE_BHair  # Thư mục mà PM2 chạy
nano .env
```

### Nội dung `.env` trên server:

```env
# Database - Point to file NGOÀI thư mục code
DATABASE_PATH=/root/data/bhair.db

# Hoặc nếu muốn giữ trong thư mục project root (không khuyến nghị):
# DATABASE_PATH=/root/BE_BHair_SQLite/bhair.db

# Other env vars...
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret
REDIS_URL=redis://127.0.0.1:6379
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
DEPLOY_SECRET=your-deploy-secret
# ... etc
```

### Lợi ích của cách này:

✅ Database không bị xóa khi CI/CD deploy  
✅ Database không xuất hiện trong Git history  
✅ Có thể backup/restore database độc lập  
✅ Có thể dùng nhiều database cho dev/staging/production  

---

## Database Backup Strategy

### Tự động backup mỗi 6 giờ:

```bash
# Tạo thư mục backup
mkdir -p /root/backups/bhair-db

# Thêm vào crontab
crontab -e

# Thêm dòng này:
0 */6 * * * sqlite3 /root/data/bhair.db ".backup /root/backups/bhair-db/bhair-$(date +\%Y\%m\%d-\%H\%M).db"

# Xóa backup cũ hơn 7 ngày
0 2 * * * find /root/backups/bhair-db -name "bhair-*.db" -mtime +7 -delete
```

### Manual backup:

```bash
# Backup database
sqlite3 /root/data/bhair.db ".backup /root/backups/bhair-backup-$(date +%Y%m%d).db"

# Restore từ backup
sqlite3 /root/data/bhair.db ".restore /root/backups/bhair-backup-20260704.db"
```

---

## Deploy Process

Khi CI/CD chạy:
1. Code mới được pull từ `production` branch
2. Dependencies được install
3. PM2 restart service
4. **Database KHÔNG bị động chạm** vì nằm ngoài thư mục code

---

## Troubleshooting

### Error: "unable to open database file"

**Nguyên nhân:** `DATABASE_PATH` không được set hoặc file không tồn tại

**Fix:**
```bash
# Check env var
cd /root/BE_BHair
cat .env | grep DATABASE_PATH

# Check file exists
ls -lh /root/data/bhair.db

# Nếu không có, tạo từ backup hoặc copy từ thư mục cũ
cp /root/BE_BHair_SQLite/bhair.db /root/data/bhair.db

# Restart
pm2 restart BE_BHair_SQLite
```

### Database locked

**Nguyên nhân:** Multiple processes truy cập cùng lúc

**Fix:**
```bash
# Check WAL mode
sqlite3 /root/data/bhair.db "PRAGMA journal_mode;"
# Should return: wal

# If not, enable it:
sqlite3 /root/data/bhair.db "PRAGMA journal_mode=WAL;"
```

---

## Security Notes

🔒 **QUAN TRỌNG:**
- Database file chứa sensitive data (passwords, user info)
- Phải có proper file permissions: `chmod 600 /root/data/bhair.db`
- Không được commit vào Git
- Backup phải được encrypt nếu upload lên cloud
- Xem xét sử dụng encryption at rest (SQLCipher)
