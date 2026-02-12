import mongoose, { Schema, Document } from 'mongoose';

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export interface IAppointment extends Document {
    // --- CHANGE START ---
    shopId: mongoose.Types.ObjectId; // Lưu booking này thuộc chi nhánh nào
    // --- CHANGE END ---

    customerId: mongoose.Types.ObjectId;
    barberId?: mongoose.Types.ObjectId;
    serviceIds: mongoose.Types.ObjectId[];
    bookingDate: Date;
    endTime: Date;
    totalPrice: number;
    status: AppointmentStatus;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
    {
        // Thêm index shopId để Admin dễ dàng lọc đơn hàng theo chi nhánh
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },

        customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        barberId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
        serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
        bookingDate: { type: Date, required: true },
        endTime: { type: Date, required: true },
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: Object.values(AppointmentStatus),
            default: AppointmentStatus.PENDING,
            index: true
        },
        note: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);