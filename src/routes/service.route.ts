import express from 'express';
import * as serviceController from '../controllers/service.controller';
import upload from '../config/multer.config';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Public Routes
router.get('/shop/:shopId', serviceController.getServicesByShop);

// Protected Routes (Manager/Admin)
router.post('/', authMiddleware.verifyToken, upload.single('image'), serviceController.createService);
router.put('/:id', authMiddleware.verifyToken, upload.single('image'), serviceController.updateService);
router.delete('/:id', authMiddleware.verifyToken, serviceController.deleteService);

export default router;
