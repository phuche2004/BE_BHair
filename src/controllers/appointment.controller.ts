import { Request, Response } from 'express';
import Appointment, { AppointmentStatus } from '../models/appointment.model';
import Service from '../models/service.model';
import User, { UserRole } from '../models/user.model';
import Shop from '../models/shop.model';

export const createAppointment = async (req: Request, res: Response) => {
    try {
        let { shopId, barberId, serviceIds, bookingDate, note } = req.body; // bookingDate is ISO string

        // 1. Validate Shop
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        // 2. Validate Services & Calculate Price/Duration
        const services = await Service.find({ _id: { $in: serviceIds }, shopId: shopId, isActive: true });
        if (services.length !== serviceIds.length) {
            return res.status(400).json({ message: 'Some services are invalid or belong to another shop' });
        }

        let totalDuration = 0;
        let totalPrice = 0;

        // 3. Check Barber Role & Apply Fees
        let barber: any = null;
        if (barberId) {
            barber = await User.findById(barberId);
            if (!barber) return res.status(404).json({ message: 'Barber not found' });

            // Ensure barber belongs to shop (simple check via shopId if implemented in User, 
            // but currently User.shopId is Reference. Let's assume passed barberId is valid for now or check if needed)
            // Ideally: if (barber.shopId.toString() !== shopId) ...
        }

        const isManager = barber && (barber.role === UserRole.MANAGER || barber.role === UserRole.ADMIN);

        services.forEach(service => {
            totalDuration += service.duration;
            totalPrice += service.price;
            if (isManager) {
                totalPrice += (service.managerExtraFee || 0);
            }
        });

        // 4. Calculate End Time
        const startDate = new Date(bookingDate);
        const endDate = new Date(startDate.getTime() + totalDuration * 60000);

        // 5. Check Availability (Overlaps)
        // If barber is selected, check their schedule
        // If no barber selected, we might assign one or just check shop capacity (simplified: require barber for now)

        if (barberId) {
            const overlap = await Appointment.findOne({
                barberId,
                status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                $or: [
                    { bookingDate: { $lt: endDate }, endTime: { $gt: startDate } }
                ]
            });

            if (overlap) {
                return res.status(400).json({ message: 'Barber is busy at this time' });
            }
        } else {
            // Logic: Check Shop Capacity (Don't assign specific barber yet)
            // 1. Count Total Active Barbers
            const totalBarbers = await User.countDocuments({
                shopId,
                role: { $in: [UserRole.MANAGER, UserRole.STAFF] },
                isActive: true
            });

            // 2. Count Concurrent Appointments (regardless of barber assignment)
            const concurrentAppointments = await Appointment.countDocuments({
                shopId,
                status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                $or: [
                    { bookingDate: { $lt: endDate }, endTime: { $gt: startDate } }
                ]
            });

            if (concurrentAppointments >= totalBarbers) {
                return res.status(400).json({ message: 'Shop is fully booked at this time. Please select another slot.' });
            }

            // Allow booking with barberId = null
        }

        // 6. Create Appointment
        const appointment = new Appointment({
            shopId,
            customerId: req.user.id,
            barberId,
            serviceIds,
            bookingDate: startDate,
            endTime: endDate,
            totalPrice,
            status: AppointmentStatus.PENDING, // Or CONFIRMED if no prepay
            note
        });

        await appointment.save();

        // --- CHANGE START: Notification Logic ---
        try {
            const { getIO } = require('../utils/socket'); // Dynamic import to avoid circular dependency issues if any
            const Notification = require('../models/notification.model').default;
            const { NotificationType } = require('../models/notification.model');

            // 1. Notify Shop Manager
            if (shop.managerId) {
                const managerIdStr = shop.managerId.toString();

                // Create DB Notification
                const noti = new Notification({
                    recipientId: shop.managerId,
                    senderId: req.user.id,
                    type: NotificationType.BOOKING_CREATED,
                    title: 'New Appointment',
                    message: `Customer has booked an appointment for ${startDate.toLocaleString()}`,
                    data: { appointmentId: appointment._id }
                });
                await noti.save();

                // Emit Socket Event
                // Client (Manager) must join room: socket.emit('join_room', managerId)
                getIO().to(managerIdStr).emit('new_notification', noti);

                // --- CHANGE START: Push Notification (FCM) ---
                const { sendPushNotification } = require('../services/notification.service');
                const manager = await User.findById(shop.managerId);
                if (manager && manager.fcmToken) {
                    await sendPushNotification({
                        token: manager.fcmToken,
                        title: '📅 New Appointment',
                        body: `New booking at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        data: {
                            type: 'BOOKING_CREATED',
                            appointmentId: appointment._id.toString()
                        }
                    });
                }
                // --- CHANGE END ---
            }

        } catch (err) {
            console.error('Notification error:', err);
            // Don't fail the request if notification fails
        }

        // --- CHANGE END ---

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyAppointments = async (req: Request, res: Response) => {
    try {
        const appointments = await Appointment.find({ customerId: req.user.id })
            .populate('shopId', 'name address')
            .populate('barberId', 'fullName')
            .populate('serviceIds', 'name price')
            .sort({ bookingDate: -1 });
        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getShopAppointments = async (req: Request, res: Response) => {
    try {
        // Manager only
        const { shopId } = req.params;

        // Verify ownership
        const shop = await Shop.findById(shopId);
        if (!shop || (shop.managerId.toString() !== req.user.id && req.user.role !== UserRole.ADMIN)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const appointments = await Appointment.find({ shopId })
            .populate('customerId', 'fullName phoneNumber')
            .populate('barberId', 'fullName')
            .populate('serviceIds', 'name duration')
            .sort({ bookingDate: 1 });

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
