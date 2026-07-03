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
exports.Gender = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["UNKOWN"] = "BOTH";
})(Gender || (exports.Gender = Gender = {}));
const ShopSchema = new mongoose_1.Schema({
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
    managerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
}, { timestamps: true });
// Tạo Index 2dsphere để query tìm quán "Gần đây"
ShopSchema.index({ location: '2dsphere' });
// Tạo Index Text để tìm kiếm theo tên và địa chỉ
ShopSchema.index({ name: 'text', address: 'text' });
exports.default = mongoose_1.default.model('Shop', ShopSchema);
