import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export enum HistoryAction {
    CREATED_APPOINTMENT = 'CREATED_APPOINTMENT',
    UPDATED_STATUS = 'UPDATED_STATUS',
    EDITED_SERVICES = 'EDITED_SERVICES',
}

export interface IHistoryLog {
    id: string;
    shopId: string;
    actorId: string;
    actorName: string;
    action: HistoryAction;
    details: string;
    createdAt?: string;
}

class HistoryLog {
    static findById(id: string): IHistoryLog | undefined {
        const stmt = db.prepare('SELECT * FROM history_logs WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static find(filters: { shopId?: string; actorId?: string; action?: HistoryAction } = {}): IHistoryLog[] {
        let query = 'SELECT * FROM history_logs WHERE 1=1';
        const params: any[] = [];
        
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
        
        query += ' ORDER BY created_at DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static create(logData: {
        shopId: string;
        actorId: string;
        actorName: string;
        action: HistoryAction;
        details: string;
    }): IHistoryLog {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO history_logs (
                id, shop_id, actor_id, actor_name, action, details
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            logData.shopId,
            logData.actorId,
            logData.actorName,
            logData.action,
            logData.details
        );
        
        return this.findById(id)!;
    }

    private static mapRow(row: any): IHistoryLog {
        return {
            id: row.id,
            shopId: row.shop_id,
            actorId: row.actor_id,
            actorName: row.actor_name,
            action: row.action as HistoryAction,
            details: row.details,
            createdAt: row.created_at
        };
    }
}

export default HistoryLog;
