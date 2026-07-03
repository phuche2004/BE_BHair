"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
class Review {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM reviews WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static findOne(filters) {
        if (filters.appointmentId) {
            const stmt = sqlite_config_1.default.prepare('SELECT * FROM reviews WHERE appointment_id = ?');
            const row = stmt.get(filters.appointmentId);
            return row ? this.mapRow(row) : undefined;
        }
        return undefined;
    }
    static find(filters = {}) {
        let query = 'SELECT * FROM reviews WHERE 1=1';
        const params = [];
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        if (filters.customerId) {
            query += ' AND customer_id = ?';
            params.push(filters.customerId);
        }
        if (filters.barberId) {
            query += ' AND barber_id = ?';
            params.push(filters.barberId);
        }
        query += ' ORDER BY created_at DESC';
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static create(reviewData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO reviews (
                id, appointment_id, shop_id, customer_id, barber_id, rating, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, reviewData.appointmentId, reviewData.shopId, reviewData.customerId, reviewData.barberId || null, reviewData.rating, reviewData.comment || null);
        return this.findById(id);
    }
    static aggregate(pipeline) {
        var _a, _b;
        // Simple aggregation for average rating
        // This is a simplified version - extend as needed
        const shopId = (_b = (_a = pipeline.find(stage => { var _a; return (_a = stage.$match) === null || _a === void 0 ? void 0 : _a.shopId; })) === null || _a === void 0 ? void 0 : _a.$match) === null || _b === void 0 ? void 0 : _b.shopId;
        if (shopId) {
            const stmt = sqlite_config_1.default.prepare(`
                SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews
                FROM reviews
                WHERE shop_id = ?
            `);
            const result = stmt.get(shopId);
            return [{ avgRating: result.avgRating || 0, totalReviews: result.totalReviews || 0 }];
        }
        return [];
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM reviews').run();
    }
    static mapRow(row) {
        return {
            id: row.id,
            appointmentId: row.appointment_id,
            shopId: row.shop_id,
            customerId: row.customer_id,
            barberId: row.barber_id,
            rating: row.rating,
            comment: row.comment,
            createdAt: row.created_at
        };
    }
}
exports.default = Review;
