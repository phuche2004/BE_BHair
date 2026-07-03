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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopReviews = exports.createReview = void 0;
const reviews_model_1 = __importDefault(require("../models/reviews.model"));
const appointment_model_1 = __importStar(require("../models/appointment.model"));
const shop_model_1 = __importDefault(require("../models/shop.model"));
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { appointmentId, rating, comment } = req.body;
        // 1. Check Appointment
        const appointment = appointment_model_1.default.findById(appointmentId);
        if (!appointment)
            return res.status(404).json({ message: 'Appointment not found' });
        // 2. Verify Ownership & Status
        if (((_a = appointment.customerId) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user.id) {
            return res.status(403).json({ message: 'You can only review your own appointments' });
        }
        if (appointment.status !== appointment_model_1.AppointmentStatus.COMPLETED) {
            return res.status(400).json({ message: 'You can only review completed appointments' });
        }
        // 3. Check Duplicate (Schema unique index protects this too)
        const existingReview = reviews_model_1.default.findOne({ appointmentId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this appointment' });
        }
        // 4. Create Review
        const newReview = reviews_model_1.default.create({
            appointmentId,
            shopId: appointment.shopId,
            customerId: req.user.id,
            barberId: appointment.barberId,
            rating,
            comment
        });
        // Removed: await newReview.save() - SQLite models are immutable
        // 5. Update Shop Average Rating
        const shopId = appointment.shopId;
        const stats = yield reviews_model_1.default.aggregate([
            { $match: { shopId: shopId } },
            {
                $group: {
                    _id: '$shopId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);
        if (stats.length > 0) {
            shop_model_1.default.findByIdAndUpdate(shopId, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
                totalReviews: stats[0].totalReviews
            });
        }
        res.status(201).json({ message: 'Review created', review: newReview });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createReview = createReview;
const getShopReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const reviews = reviews_model_1.default.find({ shopId: shopId });
        res.json(reviews);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getShopReviews = getShopReviews;
