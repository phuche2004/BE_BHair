import 'dotenv/config';

const config = {
    port: process.env.PORT || 1000,
    mongoUri: process.env.MONGODB_URI
};

export default config;