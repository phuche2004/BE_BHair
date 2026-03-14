import mongoose, { Schema, Document } from 'mongoose';

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

export interface IUser extends Document {
    phoneNumber?: string;
    password?: string;
    email?: string;
    googleId?: string;
    fullName: string;
    role: UserRole;
    avatar?: string;
    isActive?: boolean;

    // --- CHANGE START: Thêm Reference tới Shop ---
    shopId?: mongoose.Types.ObjectId;
    // --- CHANGE END ---

    fcmToken?: string;
    barberProfile?: IBarberProfile;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        phoneNumber: { type: String, unique: true, index: true, sparse: true },
        password: { type: String },
        email: { type: String, unique: true, index: true, sparse: true },
        googleId: { type: String, unique: true, index: true, sparse: true },
        fullName: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.CUSTOMER
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },

        // --- CHANGE START ---
        // Link User tới Shop. 
        // Nếu là Customer: có thể null. 
        // Nếu là Barber/Manager: nên có dữ liệu.
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop', index: true },
        // --- CHANGE END ---

        fcmToken: { type: String },
        barberProfile: {
            bio: { type: String },
            yearsExperience: { type: Number, default: 0 },
            specialties: [{ type: String }],
            isActive: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);