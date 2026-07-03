import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export interface IReview {
    id: string;
    appointmentId: string;
    shopId: string;
    customerId: string;
    barberId?: string | null;
    rating: number;
    comment?: string | null;
    createdAt?: string;
}

class Review {
    static findById(id: string): IReview | undefined {
        const stmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static findOne(filters: { appointmentId?: string }): IReview | undefined {
        if (filters.appointmentId) {
            const stmt = db.prepare('SELECT * FROM reviews WHERE appointment_id = ?');
            const row = stmt.get(filters.appointmentId) as any;
            return row ? this.mapRow(row) : undefined;
        }
        return undefined;
    }

    static find(filters: { shopId?: string; customerId?: string; barberId?: string } = {}): IReview[] {
        let query = 'SELECT * FROM reviews WHERE 1=1';
        const params: any[] = [];
        
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
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static create(reviewData: {
        appointmentId: string;
        shopId: string;
        customerId: string;
        barberId?: string;
        rating: number;
        comment?: string;
    }): IReview {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO reviews (
                id, appointment_id, shop_id, customer_id, barber_id, rating, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            reviewData.appointmentId,
            reviewData.shopId,
            reviewData.customerId,
            reviewData.barberId || null,
            reviewData.rating,
            reviewData.comment || null
        );
        
        return this.findById(id)!;
    }

    static aggregate(pipeline: any[]): any {
        // Simple aggregation for average rating
        // This is a simplified version - extend as needed
        const shopId = pipeline.find(stage => stage.$match?.shopId)?.$match?.shopId;
        
        if (shopId) {
            const stmt = db.prepare(`
                SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews
                FROM reviews
                WHERE shop_id = ?
            `);
            const result = stmt.get(shopId) as any;
            return [{ avgRating: result.avgRating || 0, totalReviews: result.totalReviews || 0 }];
        }
        
        return [];
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM reviews').run();
    }

    private static mapRow(row: any): IReview {
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

export default Review;
