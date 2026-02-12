import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    appointmentId: mongoose.Types.ObjectId;
    shopId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    barberId?: mongoose.Types.ObjectId;
    rating: number; // 1 -> 5
    comment?: string;
    createdAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
        customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        barberId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IReview>('Review', ReviewSchema);