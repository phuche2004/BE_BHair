# Hướng dẫn Setup Cloudflare Tunnel Đúng Cách

## Bước 1: Truy cập Zero Trust Dashboard

1. Vào: https://one.dash.cloudflare.com/
2. Login với account Cloudflare
3. Chọn **Networks** (menu bên trái)
4. Click **Tunnels**

## Bước 2: Tìm tunnel hiện tại

Bạn sẽ thấy tunnel: **bhair-ubuntu**
- Status: Connected (xanh) hoặc Down (đỏ)
- Click vào tên **bhair-ubuntu** để vào settings

## Bước 3: Configure Public Hostnames

1. Click tab **Public Hostname**
2. Xóa tất cả hostnames cũ (nếu có)
3. Click **Add a public hostname**

### Hostname 1: bhair.site (root domain)
- **Subdomain:** để trống
- **Domain:** chọn `bhair.site` từ dropdown
- **Path:** để trống
- **Type:** HTTP
- **URL:** `localhost:3000`
- Click **Save hostname**

### Hostname 2: www.bhair.site
- Click **Add a public hostname** lại
- **Subdomain:** `www`
- **Domain:** `bhair.site`
- **Path:** để trống
- **Type:** HTTP
- **URL:** `localhost:3000`
- Click **Save hostname**

### Hostname 3: api.bhair.site (giữ lại nếu đã có)
- **Subdomain:** `api`
- **Domain:** `bhair.site`
- **Path:** để trống
- **Type:** HTTP
- **URL:** `localhost:3000`
- Click **Save hostname**

## Bước 4: Xóa CNAME records cũ (Quan trọng!)

1. Vào: https://dash.cloudflare.com
2. Chọn domain **bhair.site**
3. Vào tab **DNS** → **Records**
4. **XÓA** các records sau (nếu có):
   - `bhair.site` type CNAME
   - `www` type CNAME
   - `api` type CNAME (nếu không phải type Tunnel)

**LƯU Ý:** KHÔNG XÓA records type **Tunnel**! Chỉ xóa CNAME!

## Bước 5: Verify

Sau 2-3 phút, kiểm tra DNS Records:
- `api.bhair.site` → type: **Tunnel**
- `bhair.site` → type: **Tunnel** (hoặc CNAME → xxx.cfargotunnel.com)
- `www.bhair.site` → type: **Tunnel** (hoặc CNAME → xxx.cfargotunnel.com)

Tất cả phải có **Proxied** (cam).

## Bước 6: Test

```bash
curl -I https://bhair.site
curl -I https://www.bhair.site
curl -I https://api.bhair.site
```

Cả 3 phải trả về **HTTP 200**.

---

## Nếu vẫn lỗi sau khi setup:

Restart tunnel trên server:

```bash
ssh root@172.16.10.245 -p 2222
pm2 restart tunnel
pm2 logs tunnel --lines 50
```

Kiểm tra logs có dòng:
```
INF Registered tunnel connection ... location=sin/hkg
```

→ Tunnel đã kết nối thành công!
