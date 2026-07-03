import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis.config';
import config from '../config/env.config';

export const loginRateLimiter = rateLimit({
    // Sử dụng Redis để lưu cache đồng bộ giữa các nhân PM2
    store: new RedisStore({
        // @ts-expect-error - Bỏ qua cảnh báo type của thư viện
        sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
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
