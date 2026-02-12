import mongoose, { Schema, Document } from 'mongoose';
export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    UNKOWN = 'BOTH'
}
export interface IShop extends Document {
    name: string;           // Tên chi nhánh (VD: 30Shine Cầu Giấy)
    address: string;        // Địa chỉ hiển thị
    gender: Gender;
    location: {             // Dùng GeoJSON để tìm kiếm theo vị trí (Maps)
        type: string;
        coordinates: number[]; // [longitude, latitude]
    };
    phone: string;          // Hotline chi nhánh
    images1: string[];       // Ảnh không gian quán
    images2: string[];
    images3: string[];
    videos: string[]; // Cloudinary URLs
    managerId: mongoose.Types.ObjectId; // Ai là quản lý chính của tiệm này?
    averageRating: number;
    totalReviews: number;
    isActive: boolean;      // Còn hoạt động không

    // --- CHANGE START: Subscription ---
    subscriptionPlan: string; // 'MONTHLY', 'YEARLY', etc.
    subscriptionExpiry?: Date;
    isPaid: boolean;
    // --- CHANGE END ---

    // --- CHANGE START: Scheduling ---
    openTime: string; // "09:00"
    closeTime: string; // "21:00"
    breakStart?: string; // "12:00"
    breakEnd?: string; // "13:00"
    slotDuration: number; // minutes (default 30)
    // --- CHANGE END ---

    createdAt: Date;
    updatedAt: Date;
}

const ShopSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        gender: { type: String, enum: Object.values(Gender), default: Gender.MALE },
        // Cấu trúc GeoJSON chuẩn cho MongoDB
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [Kinh độ, Vĩ độ]
                required: true,
            },
        },
        phone: { type: String, required: true },
        images1: [{ type: String }],
        images2: [{ type: String }],
        images3: [{ type: String }],
        videos: [{ type: String }],
        // Reference ngược lại user để biết ai là Manager quản lý tiệm này
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        averageRating: { type: Number, default: 5 },
        totalReviews: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },

        // --- CHANGE START: Subscription ---
        subscriptionPlan: { type: String, default: 'MONTHLY' }, // Mặc định là gói tháng
        subscriptionExpiry: { type: Date },
        isPaid: { type: Boolean, default: false }, // Admin sẽ duyệt hoặc tự động qua cổng thanh toán
        // --- CHANGE END ---

        // --- CHANGE START: Scheduling ---
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '21:00' },
        breakStart: { type: String },
        breakEnd: { type: String },
        slotDuration: { type: Number, default: 30 },
        // --- CHANGE END ---
    },
    { timestamps: true }
);

// Tạo Index 2dsphere để query tìm quán "Gần đây"
ShopSchema.index({ location: '2dsphere' });
// Tạo Index Text để tìm kiếm theo tên và địa chỉ
ShopSchema.index({ name: 'text', address: 'text' });

export default mongoose.model<IShop>('Shop', ShopSchema);