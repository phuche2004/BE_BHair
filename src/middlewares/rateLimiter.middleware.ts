import rateLimit from 'express-rate-limit';
import config from '../config/env.config';

// NOTE: RedisStore tạm thời bị vô hiệu hóa, fallback về memory store mặc định
export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: config.rateLimit.loginMax, // Lấy từ .env (VD: 5 lần)
    message: {
        success: false,
        message: 'Quá nhiều lượt đăng nhập, vui lòng thử lại sau 1 phút.'
    },
    standardHeaders: true, // Gửi header RateLimit-*
    legacyHeaders: false, // Tắt header X-RateLimit-* cũ
    // Trust Cloudflare proxy - chỉ trust 1 hop (Cloudflare Tunnel)
    validate: { trustProxy: false },
});
