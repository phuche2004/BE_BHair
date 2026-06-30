import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/user.model';
import Shop, { Gender } from '../models/shop.model';
import Service from '../models/service.model';
import Appointment, { AppointmentStatus } from '../models/appointment.model';
import Review from '../models/reviews.model';
import Notification, { NotificationType } from '../models/notification.model';

dotenv.config();

const seedData = async () => {
    try {
        const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
        await mongoose.connect(mongoUri);
        console.log('🔌 Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Shop.deleteMany({});
        await Service.deleteMany({});
        await Appointment.deleteMany({});
        await Review.deleteMany({});
        await Notification.deleteMany({});
        console.log('🧹 Cleared existing data');

        const password = await bcrypt.hash('123456', 10);

        // --- 1. ADMIN ---
        const admin = await User.create({
            phoneNumber: '0901234567',
            password,
            fullName: 'Admin System',
            role: UserRole.ADMIN,
            isActive: true
        });

        // --- 2. CUSTOMERS ---
        const customers = [];
        for (let i = 1; i <= 5; i++) {
            customers.push(await User.create({
                phoneNumber: `090000000${i}`,
                password,
                fullName: `Customer ${i}`,
                role: UserRole.CUSTOMER,
                avatar: `https://i.pravatar.cc/150?img=${30 + i}`,
                isActive: true
            }));
        }
        console.log(`✅ Created 1 Admin & ${customers.length} Customers`);

        // --- 3. SHOP A: 30Shine (Big Shop, Multi-Staff) ---
        const managerA = await User.create({
            phoneNumber: '0908888888',
            password,
            fullName: 'Manager 30Shine',
            role: UserRole.MANAGER,
            avatar: 'https://i.pravatar.cc/150?img=11',
            isActive: true
        });

        const shopA = await Shop.create({
            name: '30Shine Cau Giay',
            address: '123 Cau Giay, Ha Noi',
            gender: Gender.MALE,
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
        const staffA1 = await User.create({
            phoneNumber: '0908880001',
            password,
            fullName: 'Barber Tuan Anh',
            role: UserRole.STAFF,
            shopId: shopA._id,
            avatar: 'https://i.pravatar.cc/150?img=12',
            isActive: true
        });
        const staffA2 = await User.create({
            phoneNumber: '0908880002',
            password,
            fullName: 'Barber Hoang Minh',
            role: UserRole.STAFF,
            shopId: shopA._id,
            avatar: 'https://i.pravatar.cc/150?img=13',
            isActive: true
        });
        // Link Manager to Shop
        await User.findByIdAndUpdate(managerA._id, { shopId: shopA._id });

        // Services for Shop A
        const serviceA1 = await Service.create({
            shopId: shopA._id,
            name: 'Cat Goi Massage (Combo)',
            price: 100000,
            managerExtraFee: 30000,
            duration: 45,
            image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a',
            isActive: true
        });
        const serviceA2 = await Service.create({
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
        const managerB = await User.create({
            phoneNumber: '0909999999',
            password,
            fullName: 'Chu Tiem Barber House',
            role: UserRole.MANAGER,
            avatar: 'https://i.pravatar.cc/150?img=55',
            isActive: true
        });

        const shopB = await Shop.create({
            name: 'Barber House Vintage',
            address: '456 Le Duan, Da Nang',
            gender: Gender.UNKOWN, // Both
            location: { type: 'Point', coordinates: [108.220, 16.047] },
            phone: '0905123456',
            images1: ['https://images.unsplash.com/photo-1503951914875-452162b7f304'],
            managerId: managerB._id,
            openTime: '10:00',
            closeTime: '20:00',
            slotDuration: 60, // 1 hour slots
            isActive: true
        });
        await User.findByIdAndUpdate(managerB._id, { shopId: shopB._id });

        const serviceB1 = await Service.create({
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

        await Appointment.create({
            shopId: shopA._id,
            customerId: customers[0]._id,
            barberId: staffA1._id,
            serviceIds: [serviceA1._id],
            bookingDate: bookingDate9am,
            endTime: endDate9am,
            totalPrice: 100000,
            status: AppointmentStatus.CONFIRMED
        });

        await Appointment.create({
            shopId: shopA._id,
            customerId: customers[1]._id,
            barberId: staffA2._id,
            serviceIds: [serviceA1._id],
            bookingDate: bookingDate9am,
            endTime: endDate9am,
            totalPrice: 100000,
            status: AppointmentStatus.PENDING
        });

        // Scenario 2: Completed Appointment & Review
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const pastApp = await Appointment.create({
            shopId: shopA._id,
            customerId: customers[2]._id,
            barberId: managerA._id,
            serviceIds: [serviceA2._id],
            bookingDate: yesterday,
            endTime: new Date(yesterday.getTime() + 90 * 60000),
            totalPrice: 350000, // 300 + 50 extra
            status: AppointmentStatus.COMPLETED
        });

        await Review.create({
            appointmentId: pastApp._id,
            shopId: shopA._id,
            customerId: customers[2]._id,
            rating: 5,
            comment: 'Toc dep, manager lam rat ky!'
        });
        await Shop.findByIdAndUpdate(shopA._id, { averageRating: 5, totalReviews: 1 });

        // Scenario 3: Notification
        await Notification.create({
            recipientId: managerA._id,
            type: NotificationType.BOOKING_CREATED,
            title: 'New Booking',
            message: 'Customer 1 just booked a slot at 09:00',
            isRead: false
        });

        console.log('✅ Created Appointments, Reviews, Notifications');
        console.log('🎉 Seed Data Ready for Testing!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
