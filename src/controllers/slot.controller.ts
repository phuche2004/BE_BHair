import { Request, Response } from 'express';
import Shop from '../models/shop.model';
import Appointment, { AppointmentStatus } from '../models/appointment.model';
import User, { UserRole } from '../models/user.model';

export const getAvailableSlots = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const { date, barberId } = req.query; // date format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });
        }

        const shop = Shop.findById(shopId as string);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        // 1. Get Total Barbers Capacity
        let totalBarbers = 0;
        if (barberId) {
            // If checking specific barber, capacity is 1
            totalBarbers = 1;
        } else {
            // Determine shop capacity by counting active staff/managers
            const staffCount = User.countDocuments({
                shopId,
                role: { $in: [UserRole.MANAGER, UserRole.STAFF] },
                isActive: true
            });
            totalBarbers = staffCount > 0 ? staffCount : 1; // Fallback to 1 if no staff
        }

        // 2. Generate Buckets based on Shop Config
        const slots: { time: string; available: boolean; bookedCount: number; totalCapacity: number }[] = [];
        const slotDuration = shop.slotDuration || 30;

        // Múi giờ Việt Nam UTC+7 — tất cả khung giờ và so sánh đều dùng +07:00
        let current = new Date(`${date}T${shop.openTime}:00+07:00`);
        const end = new Date(`${date}T${shop.closeTime}:00+07:00`);

        // Parse Break Times (Vietnam time)
        let breakStart: Date | null = null;
        let breakEnd: Date | null = null;
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

        const query: any = {
            shopId,
            status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
            bookingDate: { $gte: dayStart, $lte: dayEnd }
        };

        if (barberId) {
            query.barberId = barberId;
        }

        const appointments = Appointment.find(query);

        // 4. Calculate Availability Per Slot
        slots.forEach(slot => {
            if (!slot.available) return; // Skip break slots

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

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
