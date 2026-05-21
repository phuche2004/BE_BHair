import mongoose, { Schema, Document } from 'mongoose';

export enum HistoryAction {
    CREATED_APPOINTMENT = 'CREATED_APPOINTMENT',
    UPDATED_STATUS = 'UPDATED_STATUS',
    EDITED_SERVICES = 'EDITED_SERVICES',
}

export interface IHistoryLog extends Document {
    shopId: mongoose.Types.ObjectId;
    actorId: mongoose.Types.ObjectId;
    actorName: string;
    action: HistoryAction;
    details: string;
    createdAt: Date;
}

const HistoryLogSchema: Schema = new Schema(
    {
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, required: true },
        action: {
            type: String,
            enum: Object.values(HistoryAction),
            required: true,
            index: true
        },
        details: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IHistoryLog>('HistoryLog', HistoryLogSchema);
