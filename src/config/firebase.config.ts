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
    // Không log ở module scope - sẽ log từ server.ts qua startupLog
} catch (error) {
    // Không log ở module scope
}

export default admin;
