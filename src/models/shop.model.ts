import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    UNKOWN = 'BOTH'
}

export interface IShop {
    id: string;
    name: string;
    address: string;
    gender: Gender;
    latitude: number;
    longitude: number;
    phone: string;
    images1?: string | null; // JSON string
    images2?: string | null; // JSON string
    images3?: string | null; // JSON string
    videos?: string | null; // JSON string
    managerId?: string | null;
    averageRating: number;
    totalReviews: number;
    isActive: boolean;
    subscriptionPlan: string;
    subscriptionExpiry?: string | null;
    isPaid: boolean;
    openTime: string;
    closeTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    slotDuration: number;
    createdAt?: string;
    updatedAt?: string;
}

class Shop {
    static findById(id: string): IShop | undefined {
        const stmt = db.prepare('SELECT * FROM shops WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static findAll(filters: { isActive?: boolean; isPaid?: boolean; managerId?: string } = {}): IShop[] {
        let query = 'SELECT * FROM shops WHERE 1=1';
        const params: any[] = [];
        
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
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static find(filters: any = {}): IShop[] {
        return this.findAll(filters);
    }

    static create(shopData: {
        name: string;
        address: string;
        gender?: Gender;
        latitude: number;
        longitude: number;
        phone: string;
        images1?: string[];
        images2?: string[];
        images3?: string[];
        videos?: string[];
        managerId?: string;
        averageRating?: number;
        totalReviews?: number;
        isActive?: boolean;
        subscriptionPlan?: string;
        subscriptionExpiry?: Date;
        isPaid?: boolean;
        openTime?: string;
        closeTime?: string;
        breakStart?: string;
        breakEnd?: string;
        slotDuration?: number;
    }): IShop {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO shops (
                id, name, address, gender, latitude, longitude, phone,
                images1, images2, images3, videos, manager_id,
                average_rating, total_reviews, is_active,
                subscription_plan, subscription_expiry, is_paid,
                open_time, close_time, break_start, break_end, slot_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            shopData.name,
            shopData.address,
            shopData.gender || Gender.MALE,
            shopData.latitude,
            shopData.longitude,
            shopData.phone,
            shopData.images1 ? JSON.stringify(shopData.images1) : null,
            shopData.images2 ? JSON.stringify(shopData.images2) : null,
            shopData.images3 ? JSON.stringify(shopData.images3) : null,
            shopData.videos ? JSON.stringify(shopData.videos) : null,
            shopData.managerId || null,
            shopData.averageRating || 5,
            shopData.totalReviews || 0,
            shopData.isActive !== false ? 1 : 0,
            shopData.subscriptionPlan || 'MONTHLY',
            shopData.subscriptionExpiry ? shopData.subscriptionExpiry.toISOString() : null,
            shopData.isPaid ? 1 : 0,
            shopData.openTime || '09:00',
            shopData.closeTime || '21:00',
            shopData.breakStart || null,
            shopData.breakEnd || null,
            shopData.slotDuration || 30
        );
        
        return this.findById(id)!;
    }

    static findByIdAndUpdate(id: string, updates: Partial<IShop>): IShop | undefined {
        const fields: string[] = [];
        const values: any[] = [];
        
        const fieldMap: Record<string, string> = {
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
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
            
            fields.push(`${dbField} = ?`);
            
            if (['images1', 'images2', 'images3', 'videos'].includes(key)) {
                values.push(updates[key as keyof IShop] ? JSON.stringify(updates[key as keyof IShop]) : null);
            } else if (['isActive', 'isPaid'].includes(key)) {
                values.push(updates[key as keyof IShop] ? 1 : 0);
            } else {
                values.push(updates[key as keyof IShop]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        
        const stmt = db.prepare(`
            UPDATE shops 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    static findNearby(latitude: number, longitude: number, radiusKm: number = 10): IShop[] {
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
        
        const stmt = db.prepare(query);
        const rows = stmt.all(latitude, longitude, latitude, radiusKm) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static search(searchText: string): IShop[] {
        const query = `
            SELECT * FROM shops
            WHERE (name LIKE ? OR address LIKE ?)
            AND is_active = 1
        `;
        const searchPattern = `%${searchText}%`;
        const stmt = db.prepare(query);
        const rows = stmt.all(searchPattern, searchPattern) as any[];
        return rows.map(row => this.mapRow(row));
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM shops').run();
    }

    private static mapRow(row: any): IShop {
        return {
            id: row.id,
            name: row.name,
            address: row.address,
            gender: row.gender as Gender,
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

export default Shop;
