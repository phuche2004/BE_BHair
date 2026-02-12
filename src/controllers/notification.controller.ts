import { Request, Response } from 'express';
import Notification from '../models/notification.model';

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.find({ recipientId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        // Ensure ownership
        if (notification.recipientId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
