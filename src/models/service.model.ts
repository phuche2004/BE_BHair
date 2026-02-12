import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    price: number; // VND
    managerExtraFee: number; // Extra fee if performed by Manager
    duration: number; // in minutes
    image?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
    {
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true, min: 0 },
        managerExtraFee: { type: Number, default: 0, min: 0 },
        duration: { type: Number, required: true, min: 1 }, // Ít nhất 1 phút
        image: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IService>('Service', ServiceSchema);
