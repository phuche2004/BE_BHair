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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importStar(require("../models/user.model"));
const shop_model_1 = __importStar(require("../models/shop.model"));
const service_model_1 = __importDefault(require("../models/service.model"));
const appointment_model_1 = __importStar(require("../models/appointment.model"));
const reviews_model_1 = __importDefault(require("../models/reviews.model"));
const notification_model_1 = __importStar(require("../models/notification.model"));
dotenv_1.default.config();
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
        yield mongoose_1.default.connect(mongoUri);
        console.log('🔌 Connected to MongoDB');
        // Clear existing data
        yield user_model_1.default.deleteMany({});
        yield shop_model_1.default.deleteMany({});
        yield service_model_1.default.deleteMany({});
        yield appointment_model_1.default.deleteMany({});
        yield reviews_model_1.default.deleteMany({});
        yield notification_model_1.default.deleteMany({});
        console.log('🧹 Cleared existing data');
        const password = yield bcrypt_1.default.hash('123456', 10);
        // --- 1. ADMIN ---
        const admin = yield user_model_1.default.create({
            phoneNumber: '0901234567',
            password,
            fullName: 'Admin System',
            role: user_model_1.UserRole.ADMIN,
            isActive: true
        });
        // --- 2. CUSTOMERS ---
        const customers = [];
        for (let i = 1; i <= 5; i++) {
            customers.push(yield user_model_1.default.create({
                phoneNumber: `090000000${i}`,
                password,
                fullName: `Customer ${i}`,
                role: user_model_1.UserRole.CUSTOMER,
                avatar: `https://i.pravatar.cc/150?img=${30 + i}`,
                isActive: true
            }));
        }
        console.log(`✅ Created 1 Admin & ${customers.length} Customers`);
        // --- 3. SHOP A: 30Shine (Big Shop, Multi-Staff) ---
        const managerA = yield user_model_1.default.create({
            phoneNumber: '0908888888',
            password,
            fullName: 'Manager 30Shine',
            role: user_model_1.UserRole.MANAGER,
            avatar: 'https://i.pravatar.cc/150?img=11',
            isActive: true
        });
        const shopA = yield shop_model_1.default.create({
            name: '30Shine Cau Giay',
            address: '123 Cau Giay, Ha Noi',
            gender: shop_model_1.Gender.MALE,
            location: { type: 'Point', coordinates: [105.799, 21.028] }, // Coordinates
            phone: '0987654321',
            images1: ['https://images.unsplash.com/photo-1585747620485-a627a3d9bf1a'],
            managerId: managerA._id,
            openTime: '09:00',
            closeTime: '21:00',
            breakStart: '12:00',
            breakEnd: '13:00',
            slotDuration: 30,
            averageRating: 0,
            totalReviews: 0,
            isActive: true
        });
        // Create 2 Staff for Shop A (Total Capacity = 1 Manager + 2 Staff = 3)
        const staffA1 = yield user_model_1.default.create({
            phoneNumber: '0908880001',
            password,
            fullName: 'Barber Tuan Anh',
            role: user_model_1.UserRole.STAFF,
            shopId: shopA._id,
            avatar: 'https://i.pravatar.cc/150?img=12',
            isActive: true
        });
        const staffA2 = yield user_model_1.default.create({
            phoneNumber: '0908880002',
            password,
            fullName: 'Barber Hoang Minh',
            role: user_model_1.UserRole.STAFF,
            shopId: shopA._id,
            avatar: 'https://i.pravatar.cc/150?img=13',
            isActive: true
        });
        // Link Manager to Shop
        yield user_model_1.default.findByIdAndUpdate(managerA._id, { shopId: shopA._id });
        // Services for Shop A
        const serviceA1 = yield service_model_1.default.create({
            shopId: shopA._id,
            name: 'Cat Goi Massage (Combo)',
            price: 100000,
            managerExtraFee: 30000,
            duration: 45,
            image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a',
            isActive: true
        });
        const serviceA2 = yield service_model_1.default.create({
            shopId: shopA._id,
            name: 'Uon Toc Han Quoc',
            price: 300000,
            managerExtraFee: 50000,
            duration: 90,
            image: 'https://images.unsplash.com/photo-1560869713-7d0a875faae7',
            isActive: true
        });
        console.log('✅ Created Shop A (3 Staff, 2 Services)');
        // --- 4. SHOP B: Barber House (Small Shop, Single Manager) ---
        const managerB = yield user_model_1.default.create({
            phoneNumber: '0909999999',
            password,
            fullName: 'Chu Tiem Barber House',
            role: user_model_1.UserRole.MANAGER,
            avatar: 'https://i.pravatar.cc/150?img=55',
            isActive: true
        });
        const shopB = yield shop_model_1.default.create({
            name: 'Barber House Vintage',
            address: '456 Le Duan, Da Nang',
            gender: shop_model_1.Gender.UNKOWN, // Both
            location: { type: 'Point', coordinates: [108.220, 16.047] },
            phone: '0905123456',
            images1: ['https://images.unsplash.com/photo-1503951914875-452162b7f304'],
            managerId: managerB._id,
            openTime: '10:00',
            closeTime: '20:00',
            slotDuration: 60, // 1 hour slots
            isActive: true
        });
        yield user_model_1.default.findByIdAndUpdate(managerB._id, { shopId: shopB._id });
        const serviceB1 = yield service_model_1.default.create({
            shopId: shopB._id,
            name: 'Classic Cut',
            price: 150000,
            managerExtraFee: 0,
            duration: 60,
            isActive: true
        });
        console.log('✅ Created Shop B (1 Manager, 1 Service)');
        // --- 5. APPOINTMENTS & LOGIC TEST DATA ---
        // Scenario 1: Shop A - Multiple bookings at 09:00
        // Capacity is 3 (Manager, Staff1, Staff2). We will book 2 slots.
        // Result expected: 09:00 still Available (2/3 booked).
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const bookingDate9am = new Date(`${dateStr}T09:00:00`);
        const endDate9am = new Date(bookingDate9am.getTime() + 45 * 60000);
        yield appointment_model_1.default.create({
            shopId: shopA._id,
            customerId: customers[0]._id,
            barberId: staffA1._id,
            serviceIds: [serviceA1._id],
            bookingDate: bookingDate9am,
            endTime: endDate9am,
            totalPrice: 100000,
            status: appointment_model_1.AppointmentStatus.CONFIRMED
        });
        yield appointment_model_1.default.create({
            shopId: shopA._id,
            customerId: customers[1]._id,
            barberId: staffA2._id,
            serviceIds: [serviceA1._id],
            bookingDate: bookingDate9am,
            endTime: endDate9am,
            totalPrice: 100000,
            status: appointment_model_1.AppointmentStatus.PENDING
        });
        // Scenario 2: Completed Appointment & Review
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const pastApp = yield appointment_model_1.default.create({
            shopId: shopA._id,
            customerId: customers[2]._id,
            barberId: managerA._id,
            serviceIds: [serviceA2._id],
            bookingDate: yesterday,
            endTime: new Date(yesterday.getTime() + 90 * 60000),
            totalPrice: 350000, // 300 + 50 extra
            status: appointment_model_1.AppointmentStatus.COMPLETED
        });
        yield reviews_model_1.default.create({
            appointmentId: pastApp._id,
            shopId: shopA._id,
            customerId: customers[2]._id,
            rating: 5,
            comment: 'Toc dep, manager lam rat ky!'
        });
        yield shop_model_1.default.findByIdAndUpdate(shopA._id, { averageRating: 5, totalReviews: 1 });
        // Scenario 3: Notification
        yield notification_model_1.default.create({
            recipientId: managerA._id,
            type: notification_model_1.NotificationType.BOOKING_CREATED,
            title: 'New Booking',
            message: 'Customer 1 just booked a slot at 09:00',
            isRead: false
        });
        console.log('✅ Created Appointments, Reviews, Notifications');
        console.log('🎉 Seed Data Ready for Testing!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
});
seedData();
