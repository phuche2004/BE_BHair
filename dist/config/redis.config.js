"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const env_config_1 = __importDefault(require("./env.config"));
const logger_1 = require("../utils/logger");
// Khởi tạo kết nối Redis
const redisClient = new ioredis_1.default({
    host: env_config_1.default.redis.host,
    port: env_config_1.default.redis.port,
    // Chiến lược thử lại nếu Redis sập: Đợi tối đa 500ms thay vì treo app
    retryStrategy(times) {
        return Math.min(times * 50, 500);
    },
});
redisClient.on('error', (err) => {
    (0, logger_1.log)('❌ Lỗi kết nối Redis:', err.message);
});
redisClient.on('connect', () => {
    (0, logger_1.startupLog)(`✅ Redis connected: ${env_config_1.default.redis.host}:${env_config_1.default.redis.port}`);
});
exports.default = redisClient;
