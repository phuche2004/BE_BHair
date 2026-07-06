"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING_CREATED"] = "BOOKING_CREATED";
    NotificationType["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NotificationType["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
    NotificationType["BOOKING_COMPLETED"] = "BOOKING_COMPLETED";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class Notification {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM notifications WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static find(filters = {}) {
        let query = 'SELECT * FROM notifications WHERE 1=1';
        const params = [];
        if (filters.recipientId) {
            query += ' AND recipient_id = ?';
            params.push(filters.recipientId);
        }
        if (filters.isRead !== undefined) {
            query += ' AND is_read = ?';
            params.push(filters.isRead ? 1 : 0);
        }
        query += ' ORDER BY created_at DESC';
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static create(notificationData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO notifications (
                id, recipient_id, sender_id, type, title, message, data, is_read
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, notificationData.recipientId, notificationData.senderId || null, notificationData.type, notificationData.title, notificationData.message, notificationData.data ? JSON.stringify(notificationData.data) : null, notificationData.isRead ? 1 : 0);
        return this.findById(id);
    }
    static findByIdAndUpdate(id, updates) {
        const fields = [];
        const values = [];
        if (updates.isRead !== undefined) {
            fields.push('is_read = ?');
            values.push(updates.isRead ? 1 : 0);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        const stmt = sqlite_config_1.default.prepare(`
            UPDATE notifications 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);
        return this.findById(id);
    }
    static updateMany(filters, updates) {
        const stmt = sqlite_config_1.default.prepare(`
            UPDATE notifications 
            SET is_read = ?
            WHERE recipient_id = ?
        `);
        stmt.run(updates.isRead ? 1 : 0, filters.recipientId);
    }
    static countDocuments(filters) {
        const stmt = sqlite_config_1.default.prepare(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE recipient_id = ? AND is_read = ?
        `);
        const result = stmt.get(filters.recipientId, filters.isRead ? 1 : 0);
        return result.count;
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM notifications').run();
    }
    static mapRow(row) {
        return {
            id: row.id,
            recipientId: row.recipient_id,
            senderId: row.sender_id,
            type: row.type,
            title: row.title,
            message: row.message,
            data: row.data ? JSON.parse(row.data) : null,
            isRead: row.is_read === 1,
            createdAt: row.created_at
        };
    }
}
exports.default = Notification;
