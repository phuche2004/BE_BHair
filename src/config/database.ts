import mongoose from 'mongoose';
import config from './env.config';

const connectMongoDB = async () => {
    try {
        await mongoose.connect(config.mongoUri || '');
        console.log('Successfully connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export default connectMongoDB;
