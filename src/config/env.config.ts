import 'dotenv/config';

const config = {
    port: process.env.PORT || 1000,
    mongoUri: process.env.MONGODB_URI,
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    rateLimit: {
        loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
    }
};

export default config;