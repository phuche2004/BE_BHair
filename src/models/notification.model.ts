import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
    BOOKING_CREATED = 'BOOKING_CREATED',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    BOOKING_COMPLETED = 'BOOKING_COMPLETED',
    SYSTEM = 'SYSTEM'
}

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId; // User receiving the notification
    senderId?: mongoose.Types.ObjectId;   // User who triggered (optional)
    type: NotificationType;
    title: string;
    message: string;
    data?: any; // Extra data (e.g., appointmentId)
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: Object.values(NotificationType), required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
