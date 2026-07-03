import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export interface IAppointment {
    id: string;
    shopId: string;
    customerId?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    barberId?: string | null;
    serviceIds: string[];
    bookingDate: string;
    endTime: string;
    totalPrice: number;
    status: AppointmentStatus;
    bookingCode: string;
    note?: string | null;
    serviceChanges?: any[];
    createdAt?: string;
    updatedAt?: string;
}

class Appointment {
    static findById(id: string): IAppointment | undefined {
        const stmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static findByBookingCode(code: string): IAppointment | undefined {
        const stmt = db.prepare('SELECT * FROM appointments WHERE booking_code = ?');
        const row = stmt.get(code) as any;
        return row ? this.mapRow(row) : undefined;
    }

    // FindOne with flexible filters (for overlap checking)
    static findOne(filters: { 
        customerId?: string;
        barberId?: string; 
        bookingDate?: string;
        status?: AppointmentStatus | { $in: AppointmentStatus[] };
        endTime?: string;
        $or?: Array<{ barberId?: string; bookingDate?: string; status?: { $in: AppointmentStatus[] } }>;
    } = {}): IAppointment | undefined {
        let query = 'SELECT * FROM appointments WHERE 1=1';
        const params: any[] = [];
        
        // Handle $or operator
        if (filters.$or) {
            const orConditions: string[] = [];
            for (const orFilter of filters.$or) {
                const orParts: string[] = [];
                const orParams: any[] = [];
                
                if (orFilter.barberId) {
                    orParts.push('barber_id = ?');
                    orParams.push(orFilter.barberId);
                }
                if (orFilter.bookingDate) {
                    orParts.push('booking_date = ?');
                    orParams.push(orFilter.bookingDate);
                }
                if (orFilter.status && typeof orFilter.status === 'object' && '$in' in orFilter.status) {
                    orParts.push('status IN (' + orFilter.status.$in.map(() => '?').join(',') + ')');
                    orParams.push(...orFilter.status.$in);
                }
                
                if (orParts.length > 0) {
                    orConditions.push('(' + orParts.join(' AND ') + ')');
                    params.push(...orParams);
                }
            }
            if (orConditions.length > 0) {
                query += ' AND (' + orConditions.join(' OR ') + ')';
            }
        }
        
        if (filters.customerId) {
            query += ' AND customer_id = ?';
            params.push(filters.customerId);
        }
        
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
            } else {
                query += ' AND status = ?';
                params.push(filters.status);
            }
        }
        
        if (filters.endTime) {
            query += ' AND end_time > ?';
            params.push(filters.endTime);
        }
        
        query += ' LIMIT 1';
        
        const stmt = db.prepare(query);
        const row = stmt.get(...params) as any;
        return row ? this.mapRow(row) : undefined;
    }

    static find(filters: { 
        shopId?: string; 
        customerId?: string; 
        barberId?: string; 
        status?: AppointmentStatus | { $in: AppointmentStatus[] };
        bookingDate?: string | { $gte?: Date | string; $lte?: Date | string };
    } = {}): IAppointment[] {
        let query = 'SELECT * FROM appointments WHERE 1=1';
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
        
        if (filters.status) {
            if (typeof filters.status === 'object' && '$in' in filters.status) {
                const statuses = filters.status.$in;
                query += ' AND status IN (' + statuses.map(() => '?').join(',') + ')';
                params.push(...statuses);
            } else {
                query += ' AND status = ?';
                params.push(filters.status);
            }
        }
        
        if (filters.bookingDate) {
            if (typeof filters.bookingDate === 'object') {
                if (filters.bookingDate.$gte) {
                    query += ' AND booking_date >= ?';
                    params.push(
                        filters.bookingDate.$gte instanceof Date
                            ? filters.bookingDate.$gte.toISOString()
                            : filters.bookingDate.$gte
                    );
                }
                if (filters.bookingDate.$lte) {
                    query += ' AND booking_date <= ?';
                    params.push(
                        filters.bookingDate.$lte instanceof Date
                            ? filters.bookingDate.$lte.toISOString()
                            : filters.bookingDate.$lte
                    );
                }
            } else {
                query += ' AND DATE(booking_date) = DATE(?)';
                params.push(filters.bookingDate);
            }
        }
        
        query += ' ORDER BY booking_date DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];
        return rows.map(row => this.mapRow(row));
    }

    static create(appointmentData: {
        shopId: string;
        customerId?: string;
        customerName?: string;
        customerPhone?: string;
        barberId?: string;
        serviceIds: string[];
        bookingDate: Date | string;
        endTime: Date | string;
        totalPrice: number;
        status?: AppointmentStatus;
        bookingCode: string;
        note?: string;
        serviceChanges?: any[];
    }): IAppointment {
        const id = uuidv4();
        
        const stmt = db.prepare(`
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
        
        stmt.run(
            id,
            appointmentData.shopId,
            appointmentData.customerId || null,
            appointmentData.customerName || null,
            appointmentData.customerPhone || null,
            appointmentData.barberId || null,
            JSON.stringify(appointmentData.serviceIds),
            bookingDate,
            endTime,
            appointmentData.totalPrice,
            appointmentData.status || AppointmentStatus.PENDING,
            appointmentData.bookingCode,
            appointmentData.note || null,
            appointmentData.serviceChanges ? JSON.stringify(appointmentData.serviceChanges) : null
        );
        
        return this.findById(id)!;
    }

    static findByIdAndUpdate(id: string, updates: Partial<IAppointment>): IAppointment | undefined {
        const fields: string[] = [];
        const values: any[] = [];
        
        const fieldMap: Record<string, string> = {
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
            if (!dbField || key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
            
            fields.push(`${dbField} = ?`);
            
            if (['serviceIds', 'serviceChanges'].includes(key)) {
                values.push(JSON.stringify(updates[key as keyof IAppointment]));
            } else {
                values.push(updates[key as keyof IAppointment]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        
        const stmt = db.prepare(`
            UPDATE appointments 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    static countDocuments(filters: { status?: AppointmentStatus | { $in: AppointmentStatus[] }; shopId?: string } = {}): number {
        let query = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1';
        const params: any[] = [];
        
        if (filters.status) {
            if (typeof filters.status === 'object' && '$in' in filters.status) {
                const statuses = filters.status.$in;
                query += ' AND status IN (' + statuses.map(() => '?').join(',') + ')';
                params.push(...statuses);
            } else {
                query += ' AND status = ?';
                params.push(filters.status);
            }
        }
        
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        
        const stmt = db.prepare(query);
        const result = stmt.get(...params) as any;
        return result.count;
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM appointments').run();
    }

    private static mapRow(row: any): IAppointment {
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
            status: row.status as AppointmentStatus,
            bookingCode: row.booking_code,
            note: row.note,
            serviceChanges: row.service_changes ? JSON.parse(row.service_changes) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export default Appointment;
