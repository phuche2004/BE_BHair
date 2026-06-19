# B_Hair — AI Rules

> Core rules. BE/FE specifics in `.github/instructions/`.

## 📘 DOCUMENTATION.md
- **Trước khi code:** đọc `DOCUMENTATION.md`.
- **Sau khi sửa code:** cập nhật `DOCUMENTATION.md` nếu thay đổi API, model, route, dependency, folder, config.

## 🔧 Không Hardcode
- BE: `process.env.*` — FE: `import.meta.env.VITE_*`+ fallback.
- API call qua `axiosInstance`. ❌ Không viết URL localhost/production.

## 🚫 Không Mock Data
❌ Không JSON giả, không data cứng. ✅ Mọi data từ MongoDB qua API thật. Test → `npm run seed`.

## 🎯 Output — Ngắn gọn, Chất lượng
- **Code trước, giải thích sau** — ưu tiên đưa code/edits, chỉ giải thích khi được hỏi.
- **Dùng `// ...existing code...`** thay vì copy nguyên file cũ.
- **Sửa ít nhất có thể** — 1 dòng đủ thì không sửa 10 dòng.
- **Mỗi response 1 hành động chính** — không ôm đồm nhiều thay đổi.
- **TypeScript strict** — không `any` trừ khi bắt buộc, dùng đúng type từ `types/`.
- **Tận dụng thư viện có sẵn** — không tự viết lại thứ đã có trong project.
- **Sau sửa:** chạy `get_errors` kiểm tra.

## 🔄 API Format
```ts
// OK: { message, data } | { message, token, user }
// Lỗi: { message, error }
// HTTP: 200|201|400|401|403|404|409|500
```

## ⚠️ Known
1. ~~Vite proxy port 3000→1000.~~ ✅
2. Appointment thiếu bookingCode auto trong schema.
3. Review: FE `userId` ≠ BE `customerId`.
4. Socket chưa auth.

