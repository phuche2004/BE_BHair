import { Request, Response } from 'express';
import Appointment, { AppointmentStatus } from '../models/appointment.model';
import Service from '../models/service.model';
import User, { UserRole } from '../models/user.model';
import Shop from '../models/shop.model';
import { Types } from 'mongoose';

const generateBookingCode = () => {
    return `#BH-${new Types.ObjectId().toString().slice(-4).toUpperCase()}`;
};

export const createAppointment = async (req: Request, res: Response) => {
    try {
        let { shopId, barberId, serviceIds, bookingDate, note, isManual, customerId, guestName, guestPhone } = req.body; // bookingDate is ISO string

        // 1. Validate Shop
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        // 1b. Kiểm tra customer đã có lịch đang chờ/xác nhận chưa
        const existingActive = await Appointment.findOne({
            customerId: req.user.id,
            status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        });
        if (existingActive) {
            return res.status(409).json({
                message: 'You already have an active appointment. Please wait until it is completed before booking another.',
                existingAppointmentId: existingActive._id,
            });
        }


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
        let customerIdObj = req.user.id;
        let cName = '';
        let cPhone = '';

        if ((req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER || req.user.role === UserRole.ADMIN) && isManual) {
             if (customerId) {
                 const target = await User.findById(customerId);
                 if (target) {
                     customerIdObj = target._id;
                     cName = target.fullName;
                     cPhone = target.phoneNumber || target.email || 'N/A';
                 } else {
                     return res.status(404).json({ message: 'Target customer not found' });
                 }
             } else {
                 customerIdObj = undefined; // Walk-in
                 cName = guestName || 'Khách vãng lai';
                 cPhone = guestPhone || 'N/A';
             }
        } else {
             const customer = await User.findById(req.user.id);
             if (!customer) return res.status(404).json({ message: 'Customer not found' });
             cName = customer.fullName;
             cPhone = customer.phoneNumber || customer.email || 'N/A';
        }

        const appointment = new Appointment({
            shopId,
            customerId: customerIdObj,
            customerName: cName,
            customerPhone: cPhone,
            barberId,
            serviceIds,
            bookingDate: startDate,
            endTime: endDate,
            totalPrice,
            status: AppointmentStatus.PENDING, 
            bookingCode: generateBookingCode(),
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
            .populate('shopId', 'name address images1')
            .populate('barberId', 'fullName avatar')
            .populate('serviceIds', 'name price duration image')
            .sort({ bookingDate: -1 })
            .lean();

        const transformed = appointments.map((appt: any) => ({
            ...appt,
            bookingCode: appt.bookingCode || `#BH-${String(appt._id).slice(-4).toUpperCase()}`
        }));

        res.json(transformed);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAppointmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id)
            .populate('shopId', 'name address images1 phone')
            .populate('barberId', 'fullName avatar')
            .populate('serviceIds', 'name price duration image');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // ── Kiểm tra quyền xem ──────────────────────────────────────────────
        const isOwner = appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === UserRole.ADMIN;

        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER)) {
            const dbUser = await User.findById(req.user.id).select('shopId');
            userShopId = dbUser?.shopId?.toString();
        }

        const isShopStaff =
            (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER) &&
            userShopId?.toString() === appointment.shopId._id.toString();

        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to view this appointment' });
        }
        // ────────────────────────────────────────────────────────────────────
        
        const transformed = {
            ...appointment.toObject(),
            bookingCode: appointment.bookingCode || `#BH-${String(appointment._id).slice(-4).toUpperCase()}`
        };

        res.json(transformed);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const cancelAppointment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // ── Kiểm tra quyền hủy ──────────────────────────────────────────────
        const isOwner = appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === UserRole.ADMIN;

        // shopId từ JWT (sau khi fix) hoặc DB lookup cho token cũ
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER)) {
            const dbUser = await User.findById(req.user.id).select('shopId');
            userShopId = dbUser?.shopId?.toString();
        }

        const isShopStaff =
            (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER) &&
            userShopId?.toString() === appointment.shopId.toString();

        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }
        // ────────────────────────────────────────────────────────────────────

        if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.CONFIRMED) {
            return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
        }

        appointment.status = AppointmentStatus.CANCELLED;
        await appointment.save();

        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // ── Kiểm tra quyền cập nhật ──────────────────────────────────────────────
        const isOwner = appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === UserRole.ADMIN;

        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER)) {
            const dbUser = await User.findById(req.user.id).select('shopId');
            userShopId = dbUser?.shopId?.toString();
        }

        const isShopStaff =
            (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER) &&
            userShopId?.toString() === appointment.shopId.toString();

        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to update this appointment status' });
        }
        // ────────────────────────────────────────────────────────────────────

        // Validate status enum
        if (!Object.values(AppointmentStatus).includes(status as any)) {
            return res.status(400).json({ message: `Invalid status: ${status}` });
        }

        // Customers can only CANCEL
        if (isOwner && !isAdmin && !isShopStaff && status !== AppointmentStatus.CANCELLED) {
            return res.status(403).json({ message: 'Customer can only cancel appointments' });
        }

        appointment.status = status;
        await appointment.save();

        res.json({ message: `Appointment status updated to ${status}`, appointment });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const getShopAppointments = async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;

        // Verify ownership (Manager or Staff of the shop)
        const shop = await Shop.findById(shopId);

        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER)) {
            const dbUser = await User.findById(req.user.id).select('shopId');
            userShopId = dbUser?.shopId?.toString();
        }

        const isShopStaff = (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER) && userShopId === shopId;

        if (!shop || (shop.managerId.toString() !== req.user.id && req.user.role !== UserRole.ADMIN && !isShopStaff)) {
            return res.status(403).json({ message: 'Not authorized to view appointments for this shop' });
        }

        const appointments = await Appointment.find({ shopId })
            .populate('barberId', 'fullName')
            .populate('serviceIds', 'name duration')
            .sort({ bookingDate: 1 });

        res.json(appointments);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAppointmentServices = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { serviceChanges } = req.body; 
        
        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const isAdmin = req.user.role === UserRole.ADMIN;
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER)) {
            const dbUser = await User.findById(req.user.id).select('shopId');
            userShopId = dbUser?.shopId?.toString();
        }
        const isShopStaff = (req.user.role === UserRole.STAFF || req.user.role === UserRole.MANAGER) && userShopId?.toString() === appointment.shopId.toString();

        if (!isAdmin && !isShopStaff) return res.status(403).json({ message: 'Not authorized to edit services' });
        
        if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.CONFIRMED) {
            return res.status(400).json({ message: 'Cannot edit services for completed or cancelled appointments' });
        }

        const updater = await User.findById(req.user.id);
        if (!updater) return res.status(404).json({ message: 'User not found' });

        let currentServiceIds = appointment.serviceIds.map(s => s.toString());
        let currentPrice = appointment.totalPrice;

        for (const change of serviceChanges) {
            const svc = await Service.findById(change.serviceId);
            if (!svc) continue;

            if (change.action === 'ADDED' && !currentServiceIds.includes(change.serviceId)) {
                currentServiceIds.push(change.serviceId);
                currentPrice += svc.price;
            } else if (change.action === 'REMOVED' && currentServiceIds.includes(change.serviceId)) {
                currentServiceIds = currentServiceIds.filter(s => s !== change.serviceId);
                currentPrice -= svc.price;
            }

            if (!appointment.serviceChanges) appointment.serviceChanges = [];
            appointment.serviceChanges.push({
                action: change.action,
                serviceId: svc._id as Types.ObjectId,
                byName: updater.fullName,
                byId: updater._id as Types.ObjectId,
                date: new Date()
            });
        }

        appointment.serviceIds = currentServiceIds as any;
        appointment.totalPrice = currentPrice;
        await appointment.save();

        res.json({ message: 'Services updated successfully', appointment });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
