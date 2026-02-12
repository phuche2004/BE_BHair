import express from 'express';
import * as notificationController from '../controllers/notification.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware.verifyToken); // All routes require auth

router.get('/', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
