import { Request, Response } from 'express';
import Notification from '../models/notification.model';

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = Notification.find({ recipientId: req.user.id })
            
            ;
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existing = Notification.findById(id as string);

        if (!existing) return res.status(404).json({ message: 'Notification not found' });

        if (existing.recipientId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const notification = Notification.findByIdAndUpdate(id as string, { isRead: true });

        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        Notification.updateMany(
            { recipientId: req.user.id },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
