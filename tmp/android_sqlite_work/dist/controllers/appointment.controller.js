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
exports.updateAppointmentServices = exports.getShopAppointments = exports.updateAppointmentStatus = exports.cancelAppointment = exports.getAppointmentById = exports.getMyAppointments = exports.createAppointment = void 0;
const appointment_model_1 = __importStar(require("../models/appointment.model"));
const service_model_1 = __importDefault(require("../models/service.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const shop_model_1 = __importDefault(require("../models/shop.model"));
const mongoose_1 = require("mongoose");
const generateBookingCode = () => {
    return `#BH-${new mongoose_1.Types.ObjectId().toString().slice(-4).toUpperCase()}`;
};
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { shopId, barberId, serviceIds, bookingDate, note, isManual, customerId, guestName, guestPhone } = req.body; // bookingDate is ISO string
        // 1. Validate Shop
        const shop = yield shop_model_1.default.findById(shopId);
        if (!shop)
            return res.status(404).json({ message: 'Shop not found' });
        // 1b. Kiểm tra customer đã có lịch đang chờ/xác nhận chưa
        const existingActive = yield appointment_model_1.default.findOne({
            customerId: req.user.id,
            status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] },
        });
        if (existingActive) {
            return res.status(409).json({
                message: 'Bạn đã có một lịch hẹn đang chờ. Vui lòng hoàn tất hoặc hủy lịch hẹn hiện tại trước khi đặt lịch mới.',
                existingAppointmentId: existingActive._id,
            });
        }
        // 2. Validate Services & Calculate Price/Duration
        const services = yield service_model_1.default.find({ _id: { $in: serviceIds }, shopId: shopId, isActive: true });
        if (services.length !== serviceIds.length) {
            return res.status(400).json({ message: 'Some services are invalid or belong to another shop' });
        }
        let totalDuration = 0;
        let totalPrice = 0;
        // 3. Check Barber Role & Apply Fees
        let barber = null;
        if (barberId) {
            barber = yield user_model_1.default.findById(barberId);
            if (!barber)
                return res.status(404).json({ message: 'Barber not found' });
            // Ensure barber belongs to shop (simple check via shopId if implemented in User, 
            // but currently User.shopId is Reference. Let's assume passed barberId is valid for now or check if needed)
            // Ideally: if (barber.shopId.toString() !== shopId) ...
        }
        const isManager = barber && (barber.role === user_model_1.UserRole.MANAGER || barber.role === user_model_1.UserRole.ADMIN);
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
            const overlap = yield appointment_model_1.default.findOne({
                barberId,
                status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] },
                $or: [
                    { bookingDate: { $lt: endDate }, endTime: { $gt: startDate } }
                ]
            });
            if (overlap) {
                return res.status(400).json({ message: 'Barber is busy at this time' });
            }
        }
        else {
            // Logic: Check Shop Capacity (Don't assign specific barber yet)
            // 1. Count Total Active Barbers
            const totalBarbers = yield user_model_1.default.countDocuments({
                shopId,
                role: { $in: [user_model_1.UserRole.MANAGER, user_model_1.UserRole.STAFF] },
                isActive: true
            });
            // 2. Count Concurrent Appointments (regardless of barber assignment)
            const concurrentAppointments = yield appointment_model_1.default.countDocuments({
                shopId,
                status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] },
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
        if ((req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER || req.user.role === user_model_1.UserRole.ADMIN) && isManual) {
            if (customerId) {
                const target = yield user_model_1.default.findById(customerId);
                if (target) {
                    customerIdObj = target._id;
                    cName = target.fullName;
                    cPhone = target.phoneNumber || target.email || 'N/A';
                }
                else {
                    return res.status(404).json({ message: 'Target customer not found' });
                }
            }
            else {
                customerIdObj = undefined; // Walk-in
                cName = guestName || 'Khách vãng lai';
                cPhone = guestPhone || 'N/A';
            }
        }
        else {
            const customer = yield user_model_1.default.findById(req.user.id);
            if (!customer)
                return res.status(404).json({ message: 'Customer not found' });
            cName = customer.fullName;
            cPhone = customer.phoneNumber || customer.email || 'N/A';
        }
        const appointment = new appointment_model_1.default({
            shopId,
            customerId: customerIdObj,
            customerName: cName,
            customerPhone: cPhone,
            barberId,
            serviceIds,
            bookingDate: startDate,
            endTime: endDate,
            totalPrice,
            status: appointment_model_1.AppointmentStatus.PENDING,
            bookingCode: generateBookingCode(),
            note
        });
        yield appointment.save();
        // --- HISTORY LOG ---
        try {
            const HistoryLog = require('../models/history.model').default;
            const { HistoryAction } = require('../models/history.model');
            let actorName = req.user.role === 'CUSTOMER' ? appointment.customerName : 'Nhân viên';
            if (isManual) {
                const creator = yield user_model_1.default.findById(req.user.id);
                actorName = creator ? creator.fullName : 'Nhân viên';
            }
            yield HistoryLog.create({
                shopId: appointment.shopId,
                actorId: req.user.id,
                actorName: actorName,
                action: HistoryAction.CREATED_APPOINTMENT,
                details: `Đã tạo lịch hẹn mới (Mã: ${appointment.bookingCode})`
            });
        }
        catch (e) {
            console.log('History Log Error:', e);
        }
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
                yield noti.save();
                // Emit Socket Event
                // Client (Manager) must join room: socket.emit('join_room', managerId)
                getIO().to(managerIdStr).emit('new_notification', noti);
                // --- CHANGE START: Push Notification (FCM) ---
                const { sendPushNotification } = require('../services/notification.service');
                const manager = yield user_model_1.default.findById(shop.managerId);
                if (manager && manager.fcmToken) {
                    yield sendPushNotification({
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
        }
        catch (err) {
            console.error('Notification error:', err);
            // Don't fail the request if notification fails
        }
        // --- CHANGE END ---
        res.status(201).json({
            message: 'Appointment created successfully',
            appointment
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createAppointment = createAppointment;
const getMyAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointments = yield appointment_model_1.default.find({ customerId: req.user.id })
            .populate('shopId', 'name address images1')
            .populate('barberId', 'fullName avatar')
            .populate('serviceIds', 'name price duration image')
            .sort({ bookingDate: -1 })
            .lean();
        const transformed = appointments.map((appt) => (Object.assign(Object.assign({}, appt), { bookingCode: appt.bookingCode || `#BH-${String(appt._id).slice(-4).toUpperCase()}` })));
        res.json(transformed);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getMyAppointments = getMyAppointments;
const getAppointmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const appointment = yield appointment_model_1.default.findById(id)
            .populate('shopId', 'name address images1 phone')
            .populate('barberId', 'fullName avatar')
            .populate('serviceIds', 'name price duration image');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // ── Kiểm tra quyền xem ──────────────────────────────────────────────
        const isOwner = appointment.customerId && appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === user_model_1.UserRole.ADMIN;
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER)) {
            const dbUser = yield user_model_1.default.findById(req.user.id).select('shopId');
            userShopId = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.shopId) === null || _a === void 0 ? void 0 : _a.toString();
        }
        const isShopStaff = (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER) &&
            (userShopId === null || userShopId === void 0 ? void 0 : userShopId.toString()) === appointment.shopId._id.toString();
        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to view this appointment' });
        }
        // ────────────────────────────────────────────────────────────────────
        const transformed = Object.assign(Object.assign({}, appointment.toObject()), { bookingCode: appointment.bookingCode || `#BH-${String(appointment._id).slice(-4).toUpperCase()}` });
        res.json(transformed);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getAppointmentById = getAppointmentById;
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const appointment = yield appointment_model_1.default.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // ── Kiểm tra quyền hủy ──────────────────────────────────────────────
        const isOwner = appointment.customerId && appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === user_model_1.UserRole.ADMIN;
        // shopId từ JWT (sau khi fix) hoặc DB lookup cho token cũ
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER)) {
            const dbUser = yield user_model_1.default.findById(req.user.id).select('shopId');
            userShopId = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.shopId) === null || _a === void 0 ? void 0 : _a.toString();
        }
        const isShopStaff = (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER) &&
            (userShopId === null || userShopId === void 0 ? void 0 : userShopId.toString()) === appointment.shopId.toString();
        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }
        // ────────────────────────────────────────────────────────────────────
        if (appointment.status !== appointment_model_1.AppointmentStatus.PENDING && appointment.status !== appointment_model_1.AppointmentStatus.CONFIRMED) {
            return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
        }
        appointment.status = appointment_model_1.AppointmentStatus.CANCELLED;
        yield appointment.save();
        // --- HISTORY LOG ---
        try {
            const HistoryLog = require('../models/history.model').default;
            const { HistoryAction } = require('../models/history.model');
            const actor = yield user_model_1.default.findById(req.user.id);
            yield HistoryLog.create({
                shopId: appointment.shopId,
                actorId: req.user.id,
                actorName: actor ? actor.fullName : 'Hệ thống',
                action: HistoryAction.UPDATED_STATUS,
                details: `Đã hủy lịch hẹn (Mã: ${appointment.bookingCode})`
            });
        }
        catch (e) {
            console.log('History Log Error:', e);
        }
        res.json({ message: 'Appointment cancelled successfully', appointment });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.cancelAppointment = cancelAppointment;
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = yield appointment_model_1.default.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // ── Kiểm tra quyền cập nhật ──────────────────────────────────────────────
        const isOwner = appointment.customerId.toString() === req.user.id;
        const isAdmin = req.user.role === user_model_1.UserRole.ADMIN;
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER)) {
            const dbUser = yield user_model_1.default.findById(req.user.id).select('shopId');
            userShopId = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.shopId) === null || _a === void 0 ? void 0 : _a.toString();
        }
        const isShopStaff = (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER) &&
            (userShopId === null || userShopId === void 0 ? void 0 : userShopId.toString()) === appointment.shopId.toString();
        if (!isOwner && !isAdmin && !isShopStaff) {
            return res.status(403).json({ message: 'Not authorized to update this appointment status' });
        }
        // ────────────────────────────────────────────────────────────────────
        // Validate status enum
        if (!Object.values(appointment_model_1.AppointmentStatus).includes(status)) {
            return res.status(400).json({ message: `Invalid status: ${status}` });
        }
        // Customers can only CANCEL
        if (isOwner && !isAdmin && !isShopStaff && status !== appointment_model_1.AppointmentStatus.CANCELLED) {
            return res.status(403).json({ message: 'Customer can only cancel appointments' });
        }
        appointment.status = status;
        yield appointment.save();
        // --- HISTORY LOG ---
        try {
            const HistoryLog = require('../models/history.model').default;
            const { HistoryAction } = require('../models/history.model');
            const actor = yield user_model_1.default.findById(req.user.id);
            yield HistoryLog.create({
                shopId: appointment.shopId,
                actorId: req.user.id,
                actorName: actor ? actor.fullName : 'Hệ thống',
                action: HistoryAction.UPDATED_STATUS,
                details: `Đã cập nhật trạng thái đơn ${appointment.bookingCode} thành ${status}`
            });
        }
        catch (e) {
            console.log('History Log Error:', e);
        }
        res.json({ message: `Appointment status updated to ${status}`, appointment });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
const getShopAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { shopId } = req.params;
        // Verify ownership (Manager or Staff of the shop)
        const shop = yield shop_model_1.default.findById(shopId);
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER)) {
            const dbUser = yield user_model_1.default.findById(req.user.id).select('shopId');
            userShopId = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.shopId) === null || _a === void 0 ? void 0 : _a.toString();
        }
        const isShopStaff = (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER) && userShopId === shopId;
        if (!shop || (shop.managerId.toString() !== req.user.id && req.user.role !== user_model_1.UserRole.ADMIN && !isShopStaff)) {
            return res.status(403).json({ message: 'Not authorized to view appointments for this shop' });
        }
        const appointments = yield appointment_model_1.default.find({ shopId })
            .populate('barberId', 'fullName')
            .populate('serviceIds', 'name duration')
            .sort({ bookingDate: 1 });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getShopAppointments = getShopAppointments;
const updateAppointmentServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { serviceChanges } = req.body;
        const appointment = yield appointment_model_1.default.findById(id);
        if (!appointment)
            return res.status(404).json({ message: 'Appointment not found' });
        const isAdmin = req.user.role === user_model_1.UserRole.ADMIN;
        let userShopId = req.user.shopId;
        if (!userShopId && (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER)) {
            const dbUser = yield user_model_1.default.findById(req.user.id).select('shopId');
            userShopId = (_a = dbUser === null || dbUser === void 0 ? void 0 : dbUser.shopId) === null || _a === void 0 ? void 0 : _a.toString();
        }
        const isShopStaff = (req.user.role === user_model_1.UserRole.STAFF || req.user.role === user_model_1.UserRole.MANAGER) && (userShopId === null || userShopId === void 0 ? void 0 : userShopId.toString()) === appointment.shopId.toString();
        if (!isAdmin && !isShopStaff)
            return res.status(403).json({ message: 'Not authorized to edit services' });
        if (appointment.status !== appointment_model_1.AppointmentStatus.PENDING && appointment.status !== appointment_model_1.AppointmentStatus.CONFIRMED) {
            return res.status(400).json({ message: 'Cannot edit services for completed or cancelled appointments' });
        }
        const updater = yield user_model_1.default.findById(req.user.id);
        if (!updater)
            return res.status(404).json({ message: 'User not found' });
        let currentServiceIds = appointment.serviceIds.map(s => s.toString());
        let currentPrice = appointment.totalPrice;
        for (const change of serviceChanges) {
            const svc = yield service_model_1.default.findById(change.serviceId);
            if (!svc)
                continue;
            if (change.action === 'ADDED' && !currentServiceIds.includes(change.serviceId)) {
                currentServiceIds.push(change.serviceId);
                currentPrice += svc.price;
            }
            else if (change.action === 'REMOVED' && currentServiceIds.includes(change.serviceId)) {
                currentServiceIds = currentServiceIds.filter(s => s !== change.serviceId);
                currentPrice -= svc.price;
            }
            if (!appointment.serviceChanges)
                appointment.serviceChanges = [];
            appointment.serviceChanges.push({
                action: change.action,
                serviceId: svc._id,
                byName: updater.fullName,
                byId: updater._id,
                date: new Date()
            });
        }
        appointment.serviceIds = currentServiceIds;
        appointment.totalPrice = currentPrice;
        yield appointment.save();
        // --- HISTORY LOG ---
        try {
            const HistoryLog = require('../models/history.model').default;
            const { HistoryAction } = require('../models/history.model');
            let added = serviceChanges.filter((c) => c.action === 'ADDED').length;
            let removed = serviceChanges.filter((c) => c.action === 'REMOVED').length;
            yield HistoryLog.create({
                shopId: appointment.shopId,
                actorId: req.user.id,
                actorName: updater.fullName,
                action: HistoryAction.EDITED_SERVICES,
                details: `Đã thay đổi dịch vụ đơn ${appointment.bookingCode} (Thêm: ${added}, Xoá: ${removed})`
            });
        }
        catch (e) {
            console.log('History Log Error:', e);
        }
        res.json({ message: 'Services updated successfully', appointment });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateAppointmentServices = updateAppointmentServices;
