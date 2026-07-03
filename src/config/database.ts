import mongoose from 'mongoose';
import config from './env.config';
import db from './sqlite.config';

const connectDatabase = async () => {
    const dbType = process.env.DATABASE_TYPE || 'mongodb';
    
    if (dbType === 'sqlite') {
        // SQLite is already connected via sqlite.config.ts
        console.log('✅ Using SQLite database');
        return;
    }
    
    // Default: MongoDB
    try {
        await mongoose.connect(config.mongoUri || '');
        console.log('✅ Successfully connected to MongoDB');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDatabase;
