"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gender = void 0;
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["UNKOWN"] = "BOTH";
})(Gender || (exports.Gender = Gender = {}));
class Shop {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM shops WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static findAll(filters = {}) {
        let query = 'SELECT * FROM shops WHERE 1=1';
        const params = [];
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        if (filters.isPaid !== undefined) {
            query += ' AND is_paid = ?';
            params.push(filters.isPaid ? 1 : 0);
        }
        if (filters.managerId) {
            query += ' AND manager_id = ?';
            params.push(filters.managerId);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static find(filters = {}) {
        return this.findAll(filters);
    }
    static create(shopData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO shops (
                id, name, address, gender, latitude, longitude, phone,
                images1, images2, images3, videos, manager_id,
                average_rating, total_reviews, is_active,
                subscription_plan, subscription_expiry, is_paid,
                open_time, close_time, break_start, break_end, slot_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, shopData.name, shopData.address, shopData.gender || Gender.MALE, shopData.latitude, shopData.longitude, shopData.phone, shopData.images1 ? JSON.stringify(shopData.images1) : null, shopData.images2 ? JSON.stringify(shopData.images2) : null, shopData.images3 ? JSON.stringify(shopData.images3) : null, shopData.videos ? JSON.stringify(shopData.videos) : null, shopData.managerId || null, shopData.averageRating || 5, shopData.totalReviews || 0, shopData.isActive !== false ? 1 : 0, shopData.subscriptionPlan || 'MONTHLY', shopData.subscriptionExpiry ? shopData.subscriptionExpiry.toISOString() : null, shopData.isPaid ? 1 : 0, shopData.openTime || '09:00', shopData.closeTime || '21:00', shopData.breakStart || null, shopData.breakEnd || null, shopData.slotDuration || 30);
        return this.findById(id);
    }
    static findByIdAndUpdate(id, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            name: 'name',
            address: 'address',
            gender: 'gender',
            latitude: 'latitude',
            longitude: 'longitude',
            phone: 'phone',
            images1: 'images1',
            images2: 'images2',
            images3: 'images3',
            videos: 'videos',
            managerId: 'manager_id',
            averageRating: 'average_rating',
            totalReviews: 'total_reviews',
            isActive: 'is_active',
            subscriptionPlan: 'subscription_plan',
            subscriptionExpiry: 'subscription_expiry',
            isPaid: 'is_paid',
            openTime: 'open_time',
            closeTime: 'close_time',
            breakStart: 'break_start',
            breakEnd: 'break_end',
            slotDuration: 'slot_duration'
        };
        Object.keys(updates).forEach(key => {
            const dbField = fieldMap[key];
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt')
                return;
            fields.push(`${dbField} = ?`);
            if (['images1', 'images2', 'images3', 'videos'].includes(key)) {
                values.push(updates[key] ? JSON.stringify(updates[key]) : null);
            }
            else if (['isActive', 'isPaid'].includes(key)) {
                values.push(updates[key] ? 1 : 0);
            }
            else {
                values.push(updates[key]);
            }
        });
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        const stmt = sqlite_config_1.default.prepare(`
            UPDATE shops 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);
        return this.findById(id);
    }
    static findNearby(latitude, longitude, radiusKm = 10) {
        // Simple distance calculation using Haversine formula
        // This is approximate but works for small distances
        const query = `
            SELECT *, 
            (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
            sin(radians(latitude)))) AS distance
            FROM shops
            WHERE is_active = 1
            HAVING distance < ?
            ORDER BY distance
        `;
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(latitude, longitude, latitude, radiusKm);
        return rows.map(row => this.mapRow(row));
    }
    static search(searchText) {
        const query = `
            SELECT * FROM shops
            WHERE (name LIKE ? OR address LIKE ?)
            AND is_active = 1
        `;
        const searchPattern = `%${searchText}%`;
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(searchPattern, searchPattern);
        return rows.map(row => this.mapRow(row));
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM shops').run();
    }
    static mapRow(row) {
        return {
            id: row.id,
            name: row.name,
            address: row.address,
            gender: row.gender,
            latitude: row.latitude,
            longitude: row.longitude,
            phone: row.phone,
            images1: row.images1 ? JSON.parse(row.images1) : [],
            images2: row.images2 ? JSON.parse(row.images2) : [],
            images3: row.images3 ? JSON.parse(row.images3) : [],
            videos: row.videos ? JSON.parse(row.videos) : [],
            managerId: row.manager_id,
            averageRating: row.average_rating,
            totalReviews: row.total_reviews,
            isActive: row.is_active === 1,
            subscriptionPlan: row.subscription_plan,
            subscriptionExpiry: row.subscription_expiry,
            isPaid: row.is_paid === 1,
            openTime: row.open_time,
            closeTime: row.close_time,
            breakStart: row.break_start,
            breakEnd: row.break_end,
            slotDuration: row.slot_duration,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.default = Shop;
