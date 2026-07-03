"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
class Service {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM services WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static find(filters = {}) {
        let query = 'SELECT * FROM services WHERE 1=1';
        const params = [];
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    // Find by multiple IDs (for $in queries)
    static findByIds(ids, filters = {}) {
        if (ids.length === 0)
            return [];
        let query = 'SELECT * FROM services WHERE id IN (' + ids.map(() => '?').join(',') + ')';
        const params = [...ids];
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static create(serviceData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO services (
                id, shop_id, name, description, price, 
                manager_extra_fee, duration, image, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, serviceData.shopId, serviceData.name, serviceData.description || null, serviceData.price, serviceData.managerExtraFee || 0, serviceData.duration, serviceData.image || null, serviceData.isActive !== false ? 1 : 0);
        return this.findById(id);
    }
    static findByIdAndUpdate(id, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            shopId: 'shop_id',
            name: 'name',
            description: 'description',
            price: 'price',
            managerExtraFee: 'manager_extra_fee',
            duration: 'duration',
            image: 'image',
            isActive: 'is_active'
        };
        Object.keys(updates).forEach(key => {
            const dbField = fieldMap[key];
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt')
                return;
            fields.push(`${dbField} = ?`);
            if (key === 'isActive') {
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
            UPDATE services 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);
        return this.findById(id);
    }
    static findByIdAndDelete(id) {
        const stmt = sqlite_config_1.default.prepare('DELETE FROM services WHERE id = ?');
        stmt.run(id);
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM services').run();
    }
    static mapRow(row) {
        return {
            id: row.id,
            shopId: row.shop_id,
            name: row.name,
            description: row.description,
            price: row.price,
            managerExtraFee: row.manager_extra_fee,
            duration: row.duration,
            image: row.image,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.default = Service;
