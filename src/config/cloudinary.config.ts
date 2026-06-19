import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Manually parse and configure Cloudinary to avoid initialization hoisting bugs
if (process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
        cloudinary.config({
            api_key: match[1],
            api_secret: match[2],
            cloud_name: match[3],
            secure: true
        });
    }
}

// Cloudinary will automatically configure itself if CLOUDINARY_URL is present in process.env
// We export the configured instance for use elsewhere.

export const verifyCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log('Cloudinary connected:', result.status);
        return true;
    } catch (error: any) {
        console.error('❌ Cloudinary connection failed:', error.message);
        return false;
    }
};

export default cloudinary;
