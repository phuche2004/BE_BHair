"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_config_1 = __importDefault(require("../config/redis.config"));
const env_config_1 = __importDefault(require("../config/env.config"));
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    // Sử dụng Redis để lưu cache đồng bộ giữa các nhân PM2
    store: new rate_limit_redis_1.default({
        // @ts-expect-error - Bỏ qua cảnh báo type của thư viện
        sendCommand: (...args) => redis_config_1.default.call(...args),
    }),
    windowMs: 60 * 1000, // 1 phút
    max: env_config_1.default.rateLimit.loginMax, // Lấy từ .env (VD: 5 lần)
    message: {
        success: false,
        message: 'Quá nhiều lượt đăng nhập, vui lòng thử lại sau 1 phút.'
    },
    standardHeaders: true, // Gửi header RateLimit-*
    legacyHeaders: false, // Tắt header X-RateLimit-* cũ
});
