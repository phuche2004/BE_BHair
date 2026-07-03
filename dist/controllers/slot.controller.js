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
exports.getAvailableSlots = void 0;
const shop_model_1 = __importDefault(require("../models/shop.model"));
const appointment_model_1 = __importStar(require("../models/appointment.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const getAvailableSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shopId } = req.params;
        const { date, barberId } = req.query; // date format: YYYY-MM-DD
        if (!date) {
            return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });
        }
        const shop = shop_model_1.default.findById(shopId);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        // 1. Get Total Barbers Capacity
        let totalBarbers = 0;
        if (barberId) {
            // If checking specific barber, capacity is 1
            totalBarbers = 1;
        }
        else {
            // Determine shop capacity by counting active staff/managers
            const staffCount = user_model_1.default.countDocuments({
                shopId,
                role: { $in: [user_model_1.UserRole.MANAGER, user_model_1.UserRole.STAFF] },
                isActive: true
            });
            totalBarbers = staffCount > 0 ? staffCount : 1; // Fallback to 1 if no staff
        }
        // 2. Generate Buckets based on Shop Config
        const slots = [];
        const slotDuration = shop.slotDuration || 30;
        // Múi giờ Việt Nam UTC+7 — tất cả khung giờ và so sánh đều dùng +07:00
        let current = new Date(`${date}T${shop.openTime}:00+07:00`);
        const end = new Date(`${date}T${shop.closeTime}:00+07:00`);
        // Parse Break Times (Vietnam time)
        let breakStart = null;
        let breakEnd = null;
        if (shop.breakStart && shop.breakEnd) {
            breakStart = new Date(`${date}T${shop.breakStart}:00+07:00`);
            breakEnd = new Date(`${date}T${shop.breakEnd}:00+07:00`);
        }
        // Create base slots
        while (current < end) {
            // Lấy giờ VN: toLocaleTimeString trả về đúng múi giờ +07:00 trên mọi server
            const timeString = current.toLocaleTimeString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }); // "09:00" — đúng giờ Việt Nam dù server chạy UTC
            const slotStart = new Date(current);
            // const slotEnd = new Date(current.getTime() + slotDuration * 60000); // Check range if needed
            let isBreak = false;
            // Check if slot falls inside break time
            if (breakStart && breakEnd) {
                // If Start >= BreakStart AND Start < BreakEnd
                if (slotStart >= breakStart && slotStart < breakEnd) {
                    isBreak = true;
                }
            }
            slots.push({
                time: timeString,
                available: !isBreak,
                bookedCount: 0,
                totalCapacity: totalBarbers
            });
            current.setMinutes(current.getMinutes() + slotDuration);
        }
        // 3. Fetch Existing Appointments
        // Truy vấn appointment trong ngày theo giờ Việt Nam
        const dayStart = new Date(`${date}T00:00:00+07:00`);
        const dayEnd = new Date(`${date}T23:59:59+07:00`);
        const query = {
            shopId,
            status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] },
            bookingDate: { $gte: dayStart, $lte: dayEnd }
        };
        if (barberId) {
            query.barberId = barberId;
        }
        const appointments = appointment_model_1.default.find(query);
        // 4. Calculate Availability Per Slot
        slots.forEach(slot => {
            if (!slot.available)
                return; // Skip break slots
            // Parse với timezone VN để so sánh đúng với bookingDate (UTC stored)
            const slotStart = new Date(`${date}T${slot.time}:00+07:00`);
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            // Count how many appointments overlap with this slot
            let overlapCount = 0;
            appointments.forEach(app => {
                const appStart = new Date(app.bookingDate);
                const appEnd = new Date(app.endTime);
                // Overlap condition: SlotStart < AppEnd AND SlotEnd > AppStart
                if (slotStart < appEnd && slotEnd > appStart) {
                    overlapCount++;
                }
            });
            slot.bookedCount = overlapCount;
            // Available if Booked < Capacity
            if (overlapCount >= totalBarbers) {
                slot.available = false;
            }
        });
        res.json(slots);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getAvailableSlots = getAvailableSlots;
