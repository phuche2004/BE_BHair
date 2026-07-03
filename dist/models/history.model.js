"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryAction = void 0;
const sqlite_config_1 = __importDefault(require("../config/sqlite.config"));
const uuid_1 = require("uuid");
var HistoryAction;
(function (HistoryAction) {
    HistoryAction["CREATED_APPOINTMENT"] = "CREATED_APPOINTMENT";
    HistoryAction["UPDATED_STATUS"] = "UPDATED_STATUS";
    HistoryAction["EDITED_SERVICES"] = "EDITED_SERVICES";
})(HistoryAction || (exports.HistoryAction = HistoryAction = {}));
class HistoryLog {
    static findById(id) {
        const stmt = sqlite_config_1.default.prepare('SELECT * FROM history_logs WHERE id = ?');
        const row = stmt.get(id);
        return row ? this.mapRow(row) : undefined;
    }
    static find(filters = {}, options = {}) {
        var _a, _b;
        let query = 'SELECT * FROM history_logs WHERE 1=1';
        const params = [];
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        if (filters.actorId) {
            query += ' AND actor_id = ?';
            params.push(filters.actorId);
        }
        if (filters.action) {
            query += ' AND action = ?';
            params.push(filters.action);
        }
        if ((_a = filters.createdAt) === null || _a === void 0 ? void 0 : _a.$gte) {
            query += ' AND created_at >= ?';
            params.push(filters.createdAt.$gte instanceof Date
                ? filters.createdAt.$gte.toISOString()
                : filters.createdAt.$gte);
        }
        if ((_b = filters.createdAt) === null || _b === void 0 ? void 0 : _b.$lte) {
            query += ' AND created_at <= ?';
            params.push(filters.createdAt.$lte instanceof Date
                ? filters.createdAt.$lte.toISOString()
                : filters.createdAt.$lte);
        }
        query += ' ORDER BY created_at DESC';
        if (options.limit !== undefined) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }
        if (options.skip !== undefined) {
            query += ' OFFSET ?';
            params.push(options.skip);
        }
        const stmt = sqlite_config_1.default.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRow(row));
    }
    static create(logData) {
        const id = (0, uuid_1.v4)();
        const stmt = sqlite_config_1.default.prepare(`
            INSERT INTO history_logs (
                id, shop_id, actor_id, actor_name, action, details
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, logData.shopId, logData.actorId, logData.actorName, logData.action, logData.details);
        return this.findById(id);
    }
    static mapRow(row) {
        return {
            id: row.id,
            shopId: row.shop_id,
            actorId: row.actor_id,
            actorName: row.actor_name,
            action: row.action,
            details: row.details,
            createdAt: row.created_at
        };
    }
}
exports.default = HistoryLog;
