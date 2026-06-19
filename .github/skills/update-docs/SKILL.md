---
name: update-docs
description: "Cập nhật DOCUMENTATION.md sau khi thay đổi code. Use when: sau khi thêm/sửa/xóa API, model, route, dependency, cấu trúc thư mục, hoặc business logic."
---

# Update Documentation Skill

## Mục đích

Skill này đảm bảo `DOCUMENTATION.md` luôn được đồng bộ với codebase sau mỗi lần thay đổi có ý nghĩa.

## Khi nào dùng

Skill được kích hoạt **tự động** sau khi AI agent hoàn thành một thay đổi code. Cũng có thể gọi thủ công bằng `/update-docs`.

### Trigger conditions:
- Thêm/sửa/xóa API endpoint
- Thay đổi Model schema (Mongoose)
- Thay đổi business logic / flow
- Thêm/xóa npm dependencies
- Thay đổi cấu trúc thư mục (thêm file, đổi tên, di chuyển)
- Thay đổi cấu hình deployment hoặc env vars
- Sửa known issues hoặc phát hiện issue mới

## Quy trình

### Bước 1: Xác định loại thay đổi

Phân loại thay đổi vào một trong các section của DOCUMENTATION.md:

| Section | Áp dụng khi |
|---|---|
| `## 2.2. Sơ đồ Route` | API endpoints thay đổi |
| `## 2.3. Models` | Schema thay đổi |
| `## 2.4. Auth Flow` | Auth logic thay đổi |
| `## 2.5. Booking Logic` | Booking flow thay đổi |
| `## 2.6. Slot Calculation` | Slot logic thay đổi |
| `## 2.7. External Services` | Service integration thay đổi |
| `## 3.` (Frontend) | FE pages, components, router thay đổi |
| `## 4.` (Công nghệ) | Thêm dependencies mới |
| `## 7.` (Known Issues) | Bug mới hoặc fix |

### Bước 2: Đọc DOCUMENTATION.md

```bash
# Đọc toàn bộ DOCUMENTATION.md để nắm cấu trúc hiện tại
```

### Bước 3: Cập nhật

- **Thêm mới:** Thêm mục mới vào đúng section, giữ đúng format bảng/code.
- **Sửa:** Cập nhật thông tin cũ thành mới.
- **Xóa:** Xóa mục không còn tồn tại.
- **Known Issues:** Thêm issue mới vào cuối danh sách, đánh dấu nếu đã fix.

### Bước 4: Cập nhật ngày

Sửa dòng cuối cùng của DOCUMENTATION.md:
```
*Tài liệu cập nhật: DD/MM/YYYY — Dự án B_Hair*
```

## Ví dụ

### Ví dụ 1: Thêm API endpoint mới

Nếu thêm `GET /api/v1/shop/:id/stats`:

1. Đọc DOCUMENTATION.md
2. Tìm section `### 2.2. Sơ đồ Route` → `#### Shop`
3. Thêm dòng vào bảng:
   ```
   | `GET` | `/shop/:id/stats` | `auth` | Thống kê shop |
   ```

### Ví dụ 2: Thêm field vào Model

Nếu thêm field `discount` vào Service model:

1. Cập nhật schema trong `### 2.3. Models` → `#### Service`
2. Cập nhật FE types trong section tương ứng

### Ví dụ 3: Thêm dependency mới

Nếu cài `axios-retry`:

1. Cập nhật bảng trong `### 3.8. External Libraries (FE)` hoặc thêm vào `## 4.`
2. Ghi rõ mục đích sử dụng

## Lưu ý

- **Không thay đổi format** — giữ nguyên cấu trúc markdown, bảng, code blocks.
- **Giữ tiếng Việt + English xen kẽ** — như style hiện tại của DOCUMENTATION.md.
- **Ngắn gọn, đủ ý** — không viết lại toàn bộ, chỉ cập nhật phần thay đổi.
- **Nếu không chắc chắn** về section cần cập nhật, hỏi người dùng.
