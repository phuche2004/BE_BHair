---
description: "Frontend coding rules for B_Hair React web app. Use when: creating/modifying web/src/ files — pages, components, API, store, types, locales, router. Covers architecture, auth, i18n, types, state management."
applyTo: "web/src/**"
---
# FE — B_Hair Web Rules

## 🏗️ Architecture
- `pages/{role}/` — Mỗi role thư mục riêng (customer, manager, staff, shop, auth).
- `components/` — Shared UI.
- `api/` — Axios, mỗi resource 1 file.
- `store/` — Zustand (useAuthStore, useThemeStore).
- `types/index.ts` — Interfaces.
- `locales/{vi,en}.ts` — i18n.

## 🔐 Auth
- `useAuthStore`: `token` từ `localStorage.getItem('userToken')`.
- API call tự động gắn `Authorization: Bearer <token>` qua `axiosInstance` interceptor.
- 401 → tự logout + dispatch `auth:logout`.
- Google OAuth: `GoogleOAuthProvider` trong `main.tsx`, `<GoogleLogin>` trong LoginPage/RegisterPage.

## 🌐 i18n
- Mọi text mới → thêm key vào cả `vi.ts` + `en.ts`.
- Hook: `useTranslation()` → `t('section.key')`.

## 📦 Types
- FE types (`web/src/types/index.ts`) phải khớp BE schema.
- BE đổi model → cập nhật FE types.

## 🎯 Code Style
- 2-space indent. `PascalCase.tsx` cho components, `camelCase` cho hàm/biến.
- Lazy load pages: `React.lazy(() => import(...))`.
- Route guards: `ProtectedRoute` + `role` redirect trong `KeepAliveTabs`.
- API error: lấy message từ `error.response.data.message` thay vì `error.message`.
