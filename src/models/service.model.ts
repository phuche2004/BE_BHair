import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export interface IService {
    id: string;
    shopId: string;
    name: string;
    description?: string | null;
    price: number;
    managerExtraFee: number;
    duration: number;
    image?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

class Service {
    static findById(id: string): IService | undefined {
        const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static find(filters: { shopId?: string; isActive?: boolean } = {}): IService[] {
        let query = 'SELECT * FROM services WHERE 1=1';
        const params: any[] = [];
        
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static create(serviceData: {
        shopId: string;
        name: string;
        description?: string;
        price: number;
        managerExtraFee?: number;
        duration: number;
        image?: string;
        isActive?: boolean;
    }): IService {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO services (
                id, shop_id, name, description, price, 
                manager_extra_fee, duration, image, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            serviceData.shopId,
            serviceData.name,
            serviceData.description || null,
            serviceData.price,
            serviceData.managerExtraFee || 0,
            serviceData.duration,
            serviceData.image || null,
            serviceData.isActive !== false ? 1 : 0
        );
        
        return this.findById(id)!;
    }

    static findByIdAndUpdate(id: string, updates: Partial<IService>): IService | undefined {
        const fields: string[] = [];
        const values: any[] = [];
        
        const fieldMap: Record<string, string> = {
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
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
            
            fields.push(`${dbField} = ?`);
            
            if (key === 'isActive') {
                values.push(updates[key] ? 1 : 0);
            } else {
                values.push(updates[key as keyof IService]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        
        const stmt = db.prepare(`
            UPDATE services 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    static findByIdAndDelete(id: string): void {
        const stmt = db.prepare('DELETE FROM services WHERE id = ?');
        stmt.run(id);
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM services').run();
    }

    private static mapRow(row: any): IService {
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

export default Service;
