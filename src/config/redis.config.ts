import Redis from 'ioredis';
import config from './env.config';
import { startupLog, log } from '../utils/logger';

// Khởi tạo kết nối Redis
const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    // Chiến lược thử lại nếu Redis sập: Đợi tối đa 500ms thay vì treo app
    retryStrategy(times) {
        return Math.min(times * 50, 500);
    },
});

redisClient.on('error', (err) => {
    log('❌ Lỗi kết nối Redis:', err.message);
});

redisClient.on('connect', () => {
    startupLog(`✅ Redis connected: ${config.redis.host}:${config.redis.port}`);
});

export default redisClient;
