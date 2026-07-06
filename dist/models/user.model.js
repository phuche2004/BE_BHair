"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["STAFF"] = "STAFF";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
class User {
    // Find by phone number
    static findByPhoneNumber(phoneNumber) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM users WHERE phone_number = ?');
        const row = stmt.get(phoneNumber);
        return row ? this.mapRow(row) : undefined;
    }
    // Find by email
    static findByEmail(email) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(email);
        return row ? this.mapRow(row) : undefined;
    }
    // Find by Google ID
    static findByGoogleId(googleId) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM users WHERE google_id = ?');
        const row = stmt.get(googleId);
        return row ? this.mapRow(row) : undefined;
    }
    // Find by ID
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM users WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    // Find one with flexible conditions
    static findOne(conditions) {
        if (conditions.phoneNumber) {
            return this.findByPhoneNumber(conditions.phoneNumber);
        }
        if (conditions.email) {
            return this.findByEmail(conditions.email);
        }
        if (conditions.googleId) {
            return this.findByGoogleId(conditions.googleId);
        }
        return undefined;
    }
    // Create new user
    static create(userData) {
        const id = (0, uuid_1.v4)();
        try {
            const stmt = sqlite_config_1.default.prepare(`
                INSERT INTO users (
                    id, phone_number, password, email, google_id,
                    full_name, role, avatar, is_active, shop_id, fcm_token, barber_profile
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(id, userData.phoneNumber || null, userData.password || null, userData.email || null, userData.googleId || null, userData.fullName, userData.role || UserRole.CUSTOMER, userData.avatar || '', userData.isActive !== false ? 1 : 0, userData.shopId || null, userData.fcmToken || null, userData.barberProfile ? JSON.stringify(userData.barberProfile) : null);
            console.log(`✅ User created: ${id}, changes: ${result.changes}, lastInsertRowid: ${result.lastInsertRowid}`);
            if (result.changes === 0) {
                throw new Error('Failed to insert user into database');
            }
            const createdUser = this.findById(id);
            if (!createdUser) {
                throw new Error(`User created but not found: ${id}`);
            }
            return createdUser;
        }
        catch (error) {
            console.error('❌ User.create() error:', error.message);
            console.error('   Data:', JSON.stringify(userData, null, 2));
            throw error;
        }
    }
    // Update user by ID
    static findByIdAndUpdate(id, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            fullName: 'full_name',
            phoneNumber: 'phone_number',
            password: 'password',
            email: 'email',
            googleId: 'google_id',
            role: 'role',
            avatar: 'avatar',
            isActive: 'is_active',
            shopId: 'shop_id',
            fcmToken: 'fcm_token',
            barberProfile: 'barber_profile'
        };
        Object.keys(updates).forEach(key => {
            const dbField = fieldMap[key] || key;
            if (key === 'barberProfile' && updates[key]) {
                fields.push(`${dbField} = ?`);
                values.push(JSON.stringify(updates[key]));
            }
            else if (key === 'isActive') {
                fields.push(`${dbField} = ?`);
                values.push(updates[key] ? 1 : 0);
            }
            else if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                fields.push(`${dbField} = ?`);
                values.push(updates[key]);
            }
        });
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        const stmt = sqlite_config_1.default.prepare(`
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);
        return this.findById(id);
    }
    // Select without password (for profile responses)
    static findByIdWithoutPassword(id) {
        const user = this.findById(id);
        if (!user)
            return undefined;
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        return userWithoutPassword;
    }
    // Find all with filters
    static find(filters = {}) {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        if (filters.role) {
            if (typeof filters.role === 'object' && '$in' in filters.role) {
                const roles = filters.role.$in;
                query += ' AND role IN (' + roles.map(() => '?').join(',') + ')';
                params.push(...roles);
            }
            else {
                query += ' AND role = ?';
                params.push(filters.role);
            }
        }
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
    // Map database row to IUser interface
    static mapRow(row) {
        return {
            id: row.id,
            phoneNumber: row.phone_number,
            password: row.password,
            email: row.email,
            googleId: row.google_id,
            fullName: row.full_name,
            role: row.role,
            avatar: row.avatar,
            isActive: row.is_active === 1,
            shopId: row.shop_id,
            fcmToken: row.fcm_token,
            barberProfile: row.barber_profile ? JSON.parse(row.barber_profile) : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    // Count documents
    static countDocuments(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        const params = [];
        if (filters.role) {
            if (typeof filters.role === 'object' && '$in' in filters.role) {
                const roles = filters.role.$in;
                query += ' AND role IN (' + roles.map(() => '?').join(',') + ')';
                params.push(...roles);
            }
            else {
                query += ' AND role = ?';
                params.push(filters.role);
            }
        }
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const result = stmt.get(...params);
        return result.count;
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM users').run();
    }
    // For Mongoose compatibility - simulate document with _id
    static addMongooseCompat(user) {
        return Object.assign(Object.assign({}, user), { _id: user.id });
    }
}
exports.default = User;
