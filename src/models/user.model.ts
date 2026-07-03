import db from '../config/sqlite.config';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
    CUSTOMER = 'CUSTOMER'
}

export interface IBarberProfile {
    bio?: string;
    yearsExperience?: number;
    specialties?: string[];
    isActive: boolean;
}

export interface IUser {
    id: string;
    phoneNumber?: string | null;
    password?: string | null;
    email?: string | null;
    googleId?: string | null;
    fullName: string;
    role: UserRole;
    avatar?: string;
    isActive: boolean;
    shopId?: string | null;
    fcmToken?: string | null;
    barberProfile?: string | null; // JSON string
    createdAt?: string;
    updatedAt?: string;
}

class User {
    // Find by phone number
    static findByPhoneNumber(phoneNumber: string): IUser | undefined {
        const stmt = db.prepare('SELECT * FROM users WHERE phone_number = ?');
        const row = stmt.get(phoneNumber) as any;
        return row ? this.mapRow(row) : undefined;
    }

    // Find by email
    static findByEmail(email: string): IUser | undefined {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(email) as any;
        return row ? this.mapRow(row) : undefined;
    }

    // Find by Google ID
    static findByGoogleId(googleId: string): IUser | undefined {
        const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
        const row = stmt.get(googleId) as any;
        return row ? this.mapRow(row) : undefined;
    }

    // Find by ID
    static findById(id: string): IUser | undefined {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const row = stmt.get(id) as any;
        return row ? this.mapRow(row) : undefined;
    }

    // Find one with flexible conditions
    static findOne(conditions: { phoneNumber?: string; email?: string; googleId?: string }): IUser | undefined {
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
    static create(userData: {
        fullName: string;
        phoneNumber?: string;
        password?: string;
        email?: string;
        googleId?: string;
        role?: UserRole;
        avatar?: string;
        isActive?: boolean;
        shopId?: string;
        fcmToken?: string;
        barberProfile?: IBarberProfile;
    }): IUser {
        const id = uuidv4();
        
        const stmt = db.prepare(`
            INSERT INTO users (
                id, phone_number, password, email, google_id,
                full_name, role, avatar, is_active, shop_id, fcm_token, barber_profile
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            userData.phoneNumber || null,
            userData.password || null,
            userData.email || null,
            userData.googleId || null,
            userData.fullName,
            userData.role || UserRole.CUSTOMER,
            userData.avatar || '',
            userData.isActive !== false ? 1 : 0,
            userData.shopId || null,
            userData.fcmToken || null,
            userData.barberProfile ? JSON.stringify(userData.barberProfile) : null
        );
        
        return this.findById(id)!;
    }

    // Update user by ID
    static findByIdAndUpdate(id: string, updates: Partial<IUser>): IUser | undefined {
        const fields: string[] = [];
        const values: any[] = [];
        
        const fieldMap: Record<string, string> = {
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
            } else if (key === 'isActive') {
                fields.push(`${dbField} = ?`);
                values.push(updates[key] ? 1 : 0);
            } else if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                fields.push(`${dbField} = ?`);
                values.push(updates[key as keyof IUser]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        
        const stmt = db.prepare(`
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE id = ?
        `);
        
        stmt.run(...values);
        return this.findById(id);
    }

    // Select without password (for profile responses)
    static findByIdWithoutPassword(id: string): Omit<IUser, 'password'> | undefined {
        const user = this.findById(id);
        if (!user) return undefined;
        
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Find all with filters
    static find(filters: { role?: UserRole; shopId?: string; isActive?: boolean } = {}): IUser[] {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params: any[] = [];
        
        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }
        
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

    // Map database row to IUser interface
    private static mapRow(row: any): IUser {
        return {
            id: row.id,
            phoneNumber: row.phone_number,
            password: row.password,
            email: row.email,
            googleId: row.google_id,
            fullName: row.full_name,
            role: row.role as UserRole,
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
    static countDocuments(filters: { role?: UserRole; shopId?: string; isActive?: boolean } = {}): number {
        let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        const params: any[] = [];
        
        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }
        
        if (filters.shopId) {
            query += ' AND shop_id = ?';
            params.push(filters.shopId);
        }
        
        if (filters.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }
        
        const stmt = db.prepare(query);
        const result = stmt.get(...params) as any;
        return result.count;
    }

    // Delete many (for seeding/testing)
    static deleteMany(filters: any = {}): void {
        db.prepare('DELETE FROM users').run();
    }

    // For Mongoose compatibility - simulate document with _id
    static addMongooseCompat(user: IUser): IUser & { _id: string } {
        return { ...user, _id: user.id };
    }
}

export default User;
