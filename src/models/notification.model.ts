import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
    BOOKING_CREATED = 'BOOKING_CREATED',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    BOOKING_COMPLETED = 'BOOKING_COMPLETED',
    SYSTEM = 'SYSTEM'
}

export interface INotification {
    id: string;
    recipientId: string;
    senderId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    data?: string | null; // JSON string
    isRead: boolean;
    createdAt?: string;
}

class Notification {
    static findById(id: string): INotification | undefined {
        const stmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static find(filters: { recipientId?: string; isRead?: boolean } = {}): INotification[] {
        let query = 'SELECT * FROM notifications WHERE 1=1';
        const params: any[] = [];
        
        if (filters.recipientId) {
            query += ' AND recipient_id = ?';
            params.push(filters.recipientId);
        }
        
        if (filters.isRead !== undefined) {
            query += ' AND is_read = ?';
            params.push(filters.isRead ? 1 : 0);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static create(notificationData: {
        recipientId: string;
        senderId?: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: any;
        isRead?: boolean;
    }): INotification {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO notifications (
                id, recipient_id, sender_id, type, title, message, data, is_read
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            notificationData.recipientId,
            notificationData.senderId || null,
            notificationData.type,
            notificationData.title,
            notificationData.message,
            notificationData.data ? JSON.stringify(notificationData.data) : null,
            notificationData.isRead ? 1 : 0
        );
        
        return this.findById(id)!;
    }

    static findByIdAndUpdate(id: string, updates: Partial<INotification>): INotification | undefined {
        const fields: string[] = [];
        const values: any[] = [];
        
        if (updates.isRead !== undefined) {
            fields.push('is_read = ?');
            values.push(updates.isRead ? 1 : 0);
        }
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        
        const stmt = db.prepare(`
            UPDATE notifications 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    static updateMany(filters: { recipientId: string }, updates: { isRead: boolean }): void {
        const stmt = db.prepare(`
            UPDATE notifications 
            SET is_read = ?
            WHERE recipient_id = ?
        `);
        
        stmt.run(updates.isRead ? 1 : 0, filters.recipientId);
    }

    static countDocuments(filters: { recipientId: string; isRead: boolean }): number {
        const stmt = db.prepare(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE recipient_id = ? AND is_read = ?
        `);
        
        const result = stmt.get(filters.recipientId, filters.isRead ? 1 : 0) as any;
        return result.count;
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM notifications').run();
    }

    private static mapRow(row: any): INotification {
        return {
            id: row.id,
            recipientId: row.recipient_id,
            senderId: row.sender_id,
            type: row.type as NotificationType,
            title: row.title,
            message: row.message,
            data: row.data ? JSON.parse(row.data) : null,
            isRead: row.is_read === 1,
            createdAt: row.created_at
        };
    }
}

export default Notification;
