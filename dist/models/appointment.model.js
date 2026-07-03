"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStatus = void 0;
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
class Appointment {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM appointments WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static findByBookingCode(code) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM appointments WHERE booking_code = ?');
        const row = stmt.get(code);
        return row ? this.mapRow(row) : undefined;
    }
    // FindOne with flexible filters (for overlap checking)
    static findOne(filters = {}) {
        let query = 'SELECT * FROM appointments WHERE 1=1';
        const params = [];
        if (filters.barberId) {
            query += ' AND barber_id = ?';
            params.push(filters.barberId);
        }
        if (filters.bookingDate) {
            query += ' AND booking_date = ?';
            params.push(filters.bookingDate);
        }
        if (filters.status) {
            if (typeof filters.status === 'object' && '$in' in filters.status) {
                const statuses = filters.status.$in;
                query += ' AND status IN (' + statuses.map(() => '?').join(',') + ')';
                params.push(...statuses);
            }
            else {
                query += ' AND status = ?';
                params.push(filters.status);
            }
        }
        if (filters.endTime) {
            query += ' AND end_time > ?';
            params.push(filters.endTime);
        }
        query += ' LIMIT 1';
        const stmt = sqlite_config_1.default.prepare(query);
        const row = stmt.get(...params);
        return row ? this.mapRow(row) : undefined;
    }
    static find(filters = {}) {
        let query = 'SELECT * FROM appointments WHERE 1=1';
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
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.bookingDate) {
            query += ' AND DATE(booking_date) = DATE(?)';
            params.push(filters.bookingDate);
        }
        query += ' ORDER BY booking_date DESC';
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static create(appointmentData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO appointments (
                id, shop_id, customer_id, customer_name, customer_phone,
                barber_id, service_ids, booking_date, end_time, total_price,
                status, booking_code, note, service_changes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const bookingDate = appointmentData.bookingDate instanceof Date
            ? appointmentData.bookingDate.toISOString()
            : appointmentData.bookingDate;
        const endTime = appointmentData.endTime instanceof Date
            ? appointmentData.endTime.toISOString()
            : appointmentData.endTime;
        stmt.run(id, appointmentData.shopId, appointmentData.customerId || null, appointmentData.customerName || null, appointmentData.customerPhone || null, appointmentData.barberId || null, JSON.stringify(appointmentData.serviceIds), bookingDate, endTime, appointmentData.totalPrice, appointmentData.status || AppointmentStatus.PENDING, appointmentData.bookingCode, appointmentData.note || null, appointmentData.serviceChanges ? JSON.stringify(appointmentData.serviceChanges) : null);
        return this.findById(id);
    }
    static findByIdAndUpdate(id, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            shopId: 'shop_id',
            customerId: 'customer_id',
            customerName: 'customer_name',
            customerPhone: 'customer_phone',
            barberId: 'barber_id',
            serviceIds: 'service_ids',
            bookingDate: 'booking_date',
            endTime: 'end_time',
            totalPrice: 'total_price',
            status: 'status',
            bookingCode: 'booking_code',
            note: 'note',
            serviceChanges: 'service_changes'
        };
        Object.keys(updates).forEach(key => {
            const dbField = fieldMap[key];
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt')
                return;
            fields.push(`${dbField} = ?`);
            if (['serviceIds', 'serviceChanges'].includes(key)) {
                values.push(JSON.stringify(updates[key]));
            }
            else {
                values.push(updates[key]);
            }
        });
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        const stmt = sqlite_config_1.default.prepare(`
            UPDATE appointments 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);
        return this.findById(id);
    }
    static countDocuments(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1';
        const params = [];
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const result = stmt.get(...params);
        return result.count;
    }
    // Delete many (for seeding/testing)
    static deleteMany(filters = {}) {
        sqlite_config_1.default.prepare('DELETE FROM appointments').run();
    }
    static mapRow(row) {
        return {
            id: row.id,
            shopId: row.shop_id,
            customerId: row.customer_id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            barberId: row.barber_id,
            serviceIds: row.service_ids ? JSON.parse(row.service_ids) : [],
            bookingDate: row.booking_date,
            endTime: row.end_time,
            totalPrice: row.total_price,
            status: row.status,
            bookingCode: row.booking_code,
            note: row.note,
            serviceChanges: row.service_changes ? JSON.parse(row.service_changes) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.default = Appointment;
