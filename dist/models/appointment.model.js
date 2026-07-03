"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
const AppointmentSchema = new mongoose_1.Schema({
    // Thêm index shopId để Admin dễ dàng lọc đơn hàng theo chi nhánh
    shopId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    customerName: { type: String, required: false },
    customerPhone: { type: String, required: false },
    barberId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    serviceIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true }],
    bookingDate: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: Object.values(AppointmentStatus),
        default: AppointmentStatus.PENDING,
        index: true
    },
    bookingCode: { type: String, unique: true, index: true },
    note: { type: String },
    serviceChanges: [{
            action: { type: String, enum: ['ADDED', 'REMOVED'], required: true },
            serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
            byName: { type: String, required: true },
            byId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            date: { type: Date, default: Date.now }
        }],
}, { timestamps: true });
exports.default = mongoose_1.default.model('Appointment', AppointmentSchema);
