import admin from '../config/firebase.config';

interface PushPayload {
    token: string;
    title: string;
    body: string;
    data?: { [key: string]: string };
}

export const sendPushNotification = async ({ token, title, body, data }: PushPayload) => {
    if (!token) return;

    try {
        await admin.messaging().send({
            token,
            notification: {
                title,
                body,
            },
            data: data || {}, // Data payload for app navigation
        });
        console.log(`📲 Push sent to ${token.slice(0, 10)}...`);
    } catch (error: any) {
        console.error('❌ Push Notification Failed:', error.message);
    }
};
