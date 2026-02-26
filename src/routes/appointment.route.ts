import express from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Protected Routes
router.post('/', authMiddleware.verifyToken, appointmentController.createAppointment);
router.get('/me', authMiddleware.verifyToken, appointmentController.getMyAppointments);
router.patch('/:id/cancel', authMiddleware.verifyToken, appointmentController.cancelAppointment);
router.get('/:id', authMiddleware.verifyToken, appointmentController.getAppointmentById);

// Manager/Admin Routes
router.get('/shop/:shopId', authMiddleware.verifyToken, appointmentController.getShopAppointments);

export default router;
