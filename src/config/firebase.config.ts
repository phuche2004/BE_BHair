import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
    console.log('🔥 Firebase Admin Initialized');
} catch (error) {
    console.error('⚠️ Firebase Admin Initialization Failed (Check .env):', error);
}

export default admin;
